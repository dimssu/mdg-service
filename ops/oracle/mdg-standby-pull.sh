#!/usr/bin/env bash
# mdg-standby-pull — runs on the BACKUP box at boot, before pm2 starts the apps.
# Fetches the live box's latest package (mdg-standby-push), unlocks it with
# /etc/mdg/standby.key and brings this box level: settings, built code, Khata
# Kavach release, data folder, TLS certificate.
#
# Never blocks a failover: any failure is reported and the box starts with what
# it already has. `--check` downloads and compares but changes nothing.
set -uo pipefail
export HOME="${HOME:-/root}"   # systemd starts a root unit with no HOME; nvm.sh dies on that under set -u
H=/home/ubuntu
STATE=/var/lib/mdg-standby
. /etc/mdg/role.conf
mkdir -p "$STATE"
notify() { [ -n "${NTFY_URL:-}" ] && curl -s -m 10 -H "Title: [$BOX_NAME] $1" -H "Priority: ${3:-default}" -H "Tags: ${4:-package}" -d "$2" "$NTFY_URL" >/dev/null || true; echo "$1 — $2"; }
export NVM_DIR=$H/.nvm; . "$NVM_DIR/nvm.sh" >/dev/null
CHECK=0; [ "${1:-}" = "--check" ] && CHECK=1

# Only a BACKUP box pulls. The live box rebooting must never roll itself back to
# an older package. (A failover starts the backup BEFORE moving the DNS record,
# so at this point a box being promoted still counts as the backup.)
me=${MY_IP:-$(tok=$(curl -s -m 3 -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60"); \
  curl -s -m 3 -H "X-aws-ec2-metadata-token: $tok" http://169.254.169.254/latest/meta-data/public-ipv4)}
live=$(for ns in ${AUTH_NS:-ns1.dns-parking.com ns2.dns-parking.com}; do dig +short +time=3 +tries=1 A "${PUBLIC_HOST:-api.mdgservices.in}" @"$ns"; done | grep -E '^[0-9.]+$' | head -1)
if [ -n "$live" ] && [ "$live" = "$me" ] && [ $CHECK = 0 ]; then echo "this box is live ($me) — not pulling"; exit 0; fi

work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
fail() { notify "backup package NOT applied" "$1 — starting with what this box already has." high warning; exit 0; }

timeout 120 node /usr/local/lib/mdg/s3.cjs get ops/standby/latest.enc "$work/pkg.enc" >/dev/null || fail "download failed"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/etc/mdg/standby.key -in "$work/pkg.enc" -out "$work/pkg.tgz" 2>/dev/null || fail "could not unlock (key mismatch?)"
mkdir "$work/x" && tar -xzf "$work/pkg.tgz" -C "$work/x" || fail "package damaged"
M="$work/x/meta.json"
created=$(jq -r .created "$M"); sha=$(jq -r .backend_commit "$M"); kk=$(jq -r .kk_release "$M")
have_sha=$(git -c safe.directory=$H/mdg-backend -C $H/mdg-backend rev-parse HEAD 2>/dev/null)
have_kk=$(basename "$(readlink $H/khata-kavach/current)")
echo "package from $created: backend ${sha:0:7} (here ${have_sha:0:7}), KK $kk (here $have_kk), cert to $(jq -r .cert_expiry "$M")"
if [ "$(cat $STATE/applied 2>/dev/null)" = "$created" ]; then echo "already applied"; exit 0; fi
[ $CHECK = 1 ] && { echo "--check: nothing changed"; exit 0; }

X="$work/x/home/ubuntu"
# 1. Settings. The jobs line starts OFF; mdg-role turns it on only if the DNS
#    record really points here — a stale "true" from the live box must never run.
install -o ubuntu -g ubuntu -m 600 "$X/mdg-backend/.env" $H/mdg-backend/.env
sed -i -E 's/^SCHEDULER_ENABLED=.*/SCHEDULER_ENABLED=false/' $H/mdg-backend/.env
install -o ubuntu -g ubuntu -m 600 "$X/mdg-assist-key.json" $H/mdg-assist-key.json
install -o ubuntu -g ubuntu -m 600 "$X/khata-kavach/.env" $H/khata-kavach/.env
install -o ubuntu -g ubuntu -m 644 "$X/khata-kavach/ecosystem.config.cjs" $H/khata-kavach/ecosystem.config.cjs
rsync -a --chown=ubuntu:ubuntu "$X/mdg-backend/var/" $H/mdg-backend/var/
rsync -a --chown=ubuntu:ubuntu "$X/khata-kavach/files/" $H/khata-kavach/files/

# 2. Backend code: same commit as live, then the live box's BUILT output (plain
#    JS, chip-independent) — so this small box never has to compile.
if [ "$sha" != "$have_sha" ]; then
  sudo -u ubuntu git -C $H/mdg-backend fetch -q origin && sudo -u ubuntu git -C $H/mdg-backend reset -q --hard "$sha" \
    || notify "backend commit not fetched" "Could not move the repo to ${sha:0:7}; using the packaged build anyway." high warning
fi
if [ "$(sha256sum $H/mdg-backend/package-lock.json | cut -c1-64)" != "$(jq -r .lock_sha256 "$M")" ]; then
  install -o ubuntu -g ubuntu -m 644 "$X/mdg-backend/package-lock.json" $H/mdg-backend/package-lock.json
  sudo -u ubuntu bash -c ". $NVM_DIR/nvm.sh >/dev/null; cd $H/mdg-backend && timeout 600 npm ci --no-audit --no-fund --loglevel=error" \
    || notify "npm ci failed" "Dependencies changed and did not install; the app may not start." urgent rotating_light
fi
for d in dist shared/dist; do
  rm -rf "$H/mdg-backend/$d.prev"; [ -d "$H/mdg-backend/$d" ] && mv "$H/mdg-backend/$d" "$H/mdg-backend/$d.prev"
  cp -a "$X/mdg-backend/$d" "$H/mdg-backend/$d" && chown -R ubuntu:ubuntu "$H/mdg-backend/$d" && rm -rf "$H/mdg-backend/$d.prev"
done

# 3. Khata Kavach release + switch the link
if [ "$kk" != "$have_kk" ]; then
  rsync -a --chown=ubuntu:ubuntu "$X/khata-kavach/releases/$kk" $H/khata-kavach/releases/
  sudo -u ubuntu ln -sfn "releases/$kk" $H/khata-kavach/current
fi

# 4. Certificate — only if the packaged one lasts longer than ours
if [ "$(date -d "$(jq -r .cert_expiry "$M")" +%s)" -gt "$(date -d "$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/api.mdgservices.in/fullchain.pem | cut -d= -f2)" +%s)" ]; then
  rsync -a --delete "$work/x/etc/letsencrypt/" /etc/letsencrypt/ && (nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true)
fi

echo "$created" > $STATE/applied
notify "backup box brought up to date" "Backend ${sha:0:7}, Khata Kavach $kk, certificate to $(jq -r .cert_expiry "$M") (package from $created)."
