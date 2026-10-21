#!/usr/bin/env bash
# mdg-role — decides whether THIS box is the live backend, and keeps it honest.
#
# The single source of truth is one DNS record: whichever box api.mdgservices.in
# points at (asked of Hostinger's own name servers, not a cache) is PRIMARY.
#
#   PRIMARY  -> SCHEDULER_ENABLED=true  : runs every timed job (IndianOil logins,
#               WhatsApp sends, reminders, the admin-alert heartbeat)
#   STANDBY  -> SCHEDULER_ENABLED=false : still serves every route, starts no timers
#
# So a failover is just "point the record at the other box": the old box demotes
# itself within ~20 s if it is still alive, the new one promotes itself, and the
# two can never both run the jobs for longer than one loop. No app code changes —
# the switch is one managed line in the backend's .env, so a deploy, a crash
# restart or a reboot always comes back in the right mode.
#
# Also a watchdog: if an app stops answering its health check 3 times in a row
# (~1 minute) it is restarted, and every change of state is pushed to the phone.
#
# Usage:  mdg-role loop   (systemd, forever)   |   mdg-role once   (one decision)
set -uo pipefail

CONF=/etc/mdg/role.conf
[ -r "$CONF" ] && . "$CONF"
PUBLIC_HOST="${PUBLIC_HOST:-api.mdgservices.in}"
AUTH_NS="${AUTH_NS:-ns1.dns-parking.com ns2.dns-parking.com}"
BOX_NAME="${BOX_NAME:-$(hostname)}"
LOOP_S="${LOOP_S:-20}"
APP_HOME="${APP_HOME:-/home/ubuntu}"
ENVF="$APP_HOME/mdg-backend/.env"
STATE_DIR="$APP_HOME/.mdg-role"
mkdir -p "$STATE_DIR"

export NVM_DIR="$APP_HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null 2>&1

log() { echo "$(date -u +%FT%TZ) $*"; }

notify() { # title, message, priority (min|low|default|high|urgent), tags
  log "$1 — $2"
  [ -n "${NTFY_URL:-}" ] || return 0
  curl -s -m 10 -H "Title: [$BOX_NAME] $1" -H "Priority: ${3:-default}" -H "Tags: ${4:-gear}" \
    -d "$2" "$NTFY_URL" >/dev/null || true
}

my_ip() {
  if [ -n "${MY_IP:-}" ]; then echo "$MY_IP"; return; fi
  # AWS: the public IP changes on every stop/start, so ask the instance metadata
  local tok
  tok=$(curl -s -m 3 -X PUT http://169.254.169.254/latest/api/token \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
  curl -s -m 3 -H "X-aws-ec2-metadata-token: $tok" \
    http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null | grep -E '^[0-9.]+$' || true
}

primary_ip() {
  local ns ip
  for ns in $AUTH_NS; do
    ip=$(dig +short +time=3 +tries=1 A "$PUBLIC_HOST" @"$ns" 2>/dev/null | grep -E '^[0-9.]+$' | head -1)
    [ -n "$ip" ] && { echo "$ip"; return; }
  done
}

flag_now() { grep -E '^SCHEDULER_ENABLED=' "$ENVF" 2>/dev/null | tail -1 | cut -d= -f2; }

set_flag() {
  if grep -qE '^SCHEDULER_ENABLED=' "$ENVF"; then
    sed -i -E "s/^SCHEDULER_ENABLED=.*/SCHEDULER_ENABLED=$1/" "$ENVF"
  else
    printf '\n# Managed by mdg-role (ops/oracle/mdg-role.sh): true only on the box %s points at.\nSCHEDULER_ENABLED=%s\n' \
      "$PUBLIC_HOST" "$1" >> "$ENVF"
  fi
}

app_status() { pm2 jlist 2>/dev/null | jq -r --arg n "$1" '.[] | select(.name==$n) | .pm2_env.status' | head -1; }

start_app() {
  case "$1" in
    mdg-backend)  (cd "$APP_HOME/mdg-backend" && pm2 start ecosystem.config.cjs >/dev/null 2>&1) ;;
    khata-kavach) pm2 start "$APP_HOME/khata-kavach/ecosystem.config.cjs" >/dev/null 2>&1 ;;
  esac
}

# Decide the role. With no clear answer (DNS unreachable, or the record points at
# neither box) a box that is not already primary stays standby: a missed job run
# is recoverable, two boxes logging into the same IndianOil accounts is not.
decide() {
  local p me want have
  p=$(primary_ip); me=$(my_ip)
  if [ -z "$p" ] || [ -z "$me" ]; then
    [ "${1:-}" = boot ] && [ -z "$(flag_now)" ] && set_flag false
    return 0
  fi
  if [ "$p" = "$me" ]; then want=true; else want=false; fi
  # Steadiness: while a DNS change spreads, Hostinger's name servers disagree for
  # minutes. Act only on 3 identical answers in a row (~1 min), so mixed answers
  # can never make a box flip back and forth.
  local last cnt
  read -r last cnt < "$STATE_DIR/streak" 2>/dev/null || { last=""; cnt=0; }
  if [ "$want" = "$last" ]; then cnt=$((cnt + 1)); else cnt=1; fi
  echo "$want $cnt" > "$STATE_DIR/streak"
  # Planned-switch overrides, applied at once:
  #   hold-standby  — take the OLD box off jobs before the record moves
  #   force-primary — let the NEW box take the jobs while the record spreads
  #                   (only ever with the other box held; removed once DNS agrees)
  if [ -e /etc/mdg/hold-standby ]; then want=false; cnt=99
  elif [ -e /etc/mdg/force-primary ]; then want=true; cnt=99; fi
  have=$(flag_now); have=${have:-true}   # absent == the app default (true)
  if [ "$have" != "$want" ] && [ "${1:-}" != boot ] && [ "$cnt" -lt 3 ]; then
    return 0   # not steady yet — keep the current role this round
  fi
  if [ "$have" != "$want" ]; then
    set_flag "$want"
    if [ "$(app_status mdg-backend)" = online ]; then pm2 restart mdg-backend >/dev/null 2>&1; fi
    if [ "$want" = true ]; then
      notify "now PRIMARY" "$PUBLIC_HOST points here ($me). Scheduled jobs switched ON." high "crown"
    else
      notify "now STANDBY" "$PUBLIC_HOST points at $p, not here ($me). Scheduled jobs switched OFF; still serving routes." high "zzz"
    fi
  fi
  echo "$want" > "$STATE_DIR/role"
}

declare -A fails=()
watchdog() {
  local app url code
  for app in mdg-backend khata-kavach; do
    case "$app" in
      mdg-backend)  url="http://127.0.0.1:4000/health" ;;
      khata-kavach) url="http://127.0.0.1:4100/v1/health" ;;
    esac
    if [ "$(app_status "$app")" = "" ]; then start_app "$app"; notify "$app started" "It was not under pm2; started it." default "rocket"; continue; fi
    code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "$url" || true)
    if [ "$code" = 200 ]; then
      [ "${fails[$app]:-0}" -ge 3 ] && notify "$app recovered" "Health check answers 200 again." default "white_check_mark"
      fails[$app]=0
    else
      fails[$app]=$(( ${fails[$app]:-0} + 1 ))
      if [ "${fails[$app]}" -eq 3 ]; then
        pm2 restart "$app" >/dev/null 2>&1 || start_app "$app"
        notify "$app restarted" "Health check failed 3 times in a row (last answer: ${code:-none}). Restarted it." high "warning"
      elif [ "${fails[$app]}" -eq 9 ]; then
        notify "$app STILL DOWN" "Restarted 3 minutes ago and still not answering (last: ${code:-none}). Look now." urgent "rotating_light"
      fi
    fi
  done
}

housekeeping() { # once every ~10 minutes: disk and memory headroom
  local disk avail
  disk=$(df --output=pcent / | tail -1 | tr -dc 0-9)
  avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
  if [ "$disk" -ge 85 ]; then notify "disk ${disk}% full" "Free some space on / before it fills." high "floppy_disk"; fi
  if [ "$avail" -lt "${MEM_LOW_MIB:-1024}" ]; then notify "memory low" "Only ${avail} MB available." high "warning"; fi
}

case "${1:-loop}" in
  boot) decide boot ;;
  once) decide ;;
  loop)
    n=0
    while true; do
      decide
      [ "${WATCHDOG:-1}" = 1 ] && watchdog
      if [ $(( n % 30 )) -eq 0 ]; then housekeeping; fi
      n=$(( n + 1 ))
      sleep "$LOOP_S"
    done ;;
esac
