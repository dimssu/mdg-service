#!/usr/bin/env bash
# mdg-standby-push — runs on the LIVE box. Packs everything the stopped backup
# box needs to come up identical (built code, settings, Google key, data folder,
# Khata Kavach release, TLS certificate), locks it with /etc/mdg/standby.key
# (AES-256, key exists only on the two servers) and stores it in S3 under
# ops/standby/. The backup applies it when it boots (mdg-standby-pull).
#
# Triggered by mdg-standby-push.path when code, settings or the certificate
# change, and daily by the timer. Only the PRIMARY box pushes, so a standby can
# never overwrite the package with something older. `--force` pushes anyway.
# Runs as root (reads /etc/letsencrypt).
set -euo pipefail
# systemd starts a root unit with no HOME, and nvm.sh dies on that under set -u —
# which is how every path-triggered push failed silently on 21 Oct.
export HOME="${HOME:-/root}"
H=/home/ubuntu
PKG_PREFIX=ops/standby
. /etc/mdg/role.conf
notify() { [ -n "${NTFY_URL:-}" ] && curl -s -m 10 -H "Title: [$BOX_NAME] $1" -H "Priority: ${3:-low}" -H "Tags: package" -d "$2" "$NTFY_URL" >/dev/null || true; echo "$1 — $2"; }
failed() { local rc=$?; [ "$rc" -eq 0 ] || notify "backup package NOT updated" "mdg-standby-push exited $rc, so the backup box would boot with an older copy. See: journalctl -u mdg-standby-push" high; }
trap failed EXIT

# Wait first, THEN check the role: a promotion edits .env (which fires this) a
# moment before the role switch records the new role.
[ "${1:-}" = "--force" ] || sleep "${SETTLE_S:-60}"   # also lets a deploy finish writing
if [ "${1:-}" != "--force" ] && [ "$(cat $H/.mdg-role/role 2>/dev/null)" != true ]; then
  echo "not primary — nothing to push"; exit 0
fi

export NVM_DIR=$H/.nvm; . "$NVM_DIR/nvm.sh" >/dev/null
work=$(mktemp -d); trap 'failed; rm -rf "$work"' EXIT
KK_REL=$(basename "$(readlink $H/khata-kavach/current)")
SHA=$(git -c safe.directory=$H/mdg-backend -C $H/mdg-backend rev-parse HEAD)
cat > "$work/meta.json" <<EOF
{"created": "$(date -u +%FT%TZ)", "from": "$BOX_NAME", "backend_commit": "$SHA",
 "lock_sha256": "$(sha256sum $H/mdg-backend/package-lock.json | cut -c1-64)",
 "kk_release": "$KK_REL",
 "cert_expiry": "$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/api.mdgservices.in/fullchain.pem | cut -d= -f2)"}
EOF
tar -czf "$work/pkg.tgz" -C / \
  home/ubuntu/mdg-backend/.env home/ubuntu/mdg-assist-key.json home/ubuntu/mdg-backend/var \
  home/ubuntu/mdg-backend/dist home/ubuntu/mdg-backend/shared/dist \
  home/ubuntu/mdg-backend/package.json home/ubuntu/mdg-backend/package-lock.json \
  home/ubuntu/khata-kavach/.env home/ubuntu/khata-kavach/ecosystem.config.cjs home/ubuntu/khata-kavach/files \
  "home/ubuntu/khata-kavach/releases/$KK_REL" \
  etc/letsencrypt \
  -C "$work" meta.json
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:/etc/mdg/standby.key -in "$work/pkg.tgz" -out "$work/pkg.enc"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
node /usr/local/lib/mdg/s3.cjs put "$work/pkg.enc" "$PKG_PREFIX/latest.enc"
node /usr/local/lib/mdg/s3.cjs put "$work/pkg.enc" "$PKG_PREFIX/history/$STAMP.enc"
node /usr/local/lib/mdg/s3.cjs keep "$PKG_PREFIX/history/" 5
notify "backup package updated" "Backend ${SHA:0:7}, Khata Kavach $KK_REL, certificate valid to $(jq -r .cert_expiry "$work/meta.json"). $(du -h "$work/pkg.enc" | cut -f1)."
