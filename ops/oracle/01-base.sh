#!/usr/bin/env bash
# Oracle box, step 1: the operating system around the apps. Idempotent — safe to
# re-run on the same box or on a freshly created one (Ubuntu 24.04, Arm).
#
#   scp ops/oracle/01-base.sh ubuntu@<oracle>:/tmp/ && ssh ubuntu@<oracle> 'bash /tmp/01-base.sh'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

NODE_VERSION=24.13.0   # what production (AWS) runs — keep the two boxes identical
PM2_VERSION=7.0.1

echo "== timezone: UTC, same as the AWS box (the apps carry Asia/Kolkata themselves via KAVACH_TZ)"
sudo timedatectl set-timezone Etc/UTC

echo "== swap: 4 GB. Not for normal running (12 GB RAM) — a cushion so a Chromium spike never OOM-kills the API"
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/90-mdg.conf >/dev/null
sudo sysctl -q --system

echo "== packages"
sudo apt-get update -qq
sudo apt-get install -y -qq nginx certbot python3-certbot-nginx jq dnsutils fail2ban \
  iptables-persistent netfilter-persistent python3.12-venv git gh unzip curl rsync >/dev/null

echo "== host firewall: Oracle's Ubuntu image rejects everything but SSH; let 80/443 in"
for port in 443 80; do
  if ! sudo iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null; then
    # insert just before the image's catch-all REJECT so ordering stays correct
    line=$(sudo iptables -L INPUT --line-numbers | awk '/REJECT/ {print $1; exit}')
    sudo iptables -I INPUT "${line:-1}" -p tcp -m state --state NEW --dport "$port" -j ACCEPT
  fi
done
sudo netfilter-persistent save >/dev/null

echo "== journald: cap at 500 MB so logs can never fill the disk"
sudo mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' | sudo tee /etc/systemd/journald.conf.d/mdg.conf >/dev/null
sudo systemctl restart systemd-journald

echo "== fail2ban for SSH (key-only already; this just stops the noise)"
sudo systemctl enable --now fail2ban >/dev/null 2>&1 || true

echo "== Node $NODE_VERSION + pm2 $PM2_VERSION via nvm (same layout as the AWS box)"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash >/dev/null 2>&1
. "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION" >/dev/null 2>&1
nvm alias default "$NODE_VERSION" >/dev/null
npm ls -g pm2 2>/dev/null | grep -q "pm2@$PM2_VERSION" || npm i -g "pm2@$PM2_VERSION" --silent >/dev/null 2>&1

echo "== pm2 starts at boot under systemd (pm2-ubuntu.service, like AWS)"
sudo env PATH="$PATH:$(dirname "$(command -v node)")" "$(command -v pm2)" startup systemd -u ubuntu --hp /home/ubuntu >/dev/null

echo "== pm2 log rotation (same file as AWS)"
sudo tee /etc/logrotate.d/pm2-mdg >/dev/null <<'EOF'
/home/ubuntu/.pm2/logs/*.log {
    su ubuntu ubuntu
    daily
    rotate 14
    size 20M
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

echo "== done"
echo "node $(node -v), pm2 $(pm2 -v), $(swapon --show --noheadings | awk '{print "swap", $3}'), tz $(timedatectl show -p Timezone --value)"
sudo iptables -L INPUT -n --line-numbers | grep -E "dpt:(22|80|443)|REJECT"
