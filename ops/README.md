# Running production on Oracle, with AWS as the backup

## The idea in one line

Phones and websites only ever talk to **api.mdgservices.in**. That one DNS
record decides which server is live. Moving it is the whole failover; nothing
in any app changes.

| Server                             | Address                                       | Normal role                                               |
| ---------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Oracle (Arm, 2 cores, 12 GB, free) | 92.4.88.49                                    | **Live** — serves everything, runs every scheduled job    |
| AWS (t3.small)                     | 35.154.6.55 (Elastic IP, survives stop/start) | **Backup** — kept stopped, started only when Oracle fails |

## What guards what

| Risk                                                                           | Guard                                                                                                                                                                                                                           | Where          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Oracle reclaims the "idle" server                                              | `mdg-mem-floor` holds memory so Oracle's own graph shows ~35% (rule is <20% on CPU, network **and** memory for 7 days). Shrinks when the apps need memory, never leaves <4 GB free, first to be killed if memory ever runs out. | Oracle         |
| Server lost anyway                                                             | Weekly full disk backup (Sun 21:00 UTC, kept 15 days, free) + this folder rebuilds a fresh box                                                                                                                                  | Oracle         |
| Both servers run jobs at once (double WhatsApp sends, double IndianOil logins) | `mdg-role`: only the box the DNS record points at runs jobs; checks every 20 s, flips one line in the backend `.env`, so restarts/deploys/reboots always come back in the right mode                                            | both           |
| An app hangs or crashes                                                        | `mdg-role` watchdog: 3 failed health checks (~1 min) → restart + phone alert                                                                                                                                                    | both           |
| Disk or memory running out                                                     | alert at 85% disk / low memory                                                                                                                                                                                                  | both           |
| Whole server or Oracle account dies                                            | outside monitor in AWS Lambda (needs your go-ahead, see below) → urgent phone alert + email + "Start AWS backup" button                                                                                                         | AWS Lambda     |
| Going over the free Arm allowance (Oracle deletes over-quota Arm servers)      | quota policy `free-tier-cap` blocks anything bigger than 2 cores / 12 GB                                                                                                                                                        | Oracle account |
| A surprise bill                                                                | budget `spend-alert-1` emails on any real charge                                                                                                                                                                                | Oracle account |

## Alerts

All alerts go to a private ntfy channel (name in `.secrets/ntfy-topic.txt`).
Urgent ones (site down) ring through; restarts and role changes are "high";
the daily "monitor alive" note is silent.

## Failover — Oracle is down

**With the monitor installed:** tap **Start AWS backup** on the alert. It starts
the AWS server, waits for its new address, and points api.mdgservices.in at it.
The AWS box sees the record within ~20 s and turns its jobs on. Expect 3–5
minutes end to end; phones follow the DNS change within the record's TTL.

**By hand (if the button is unavailable):**

1. AWS console → EC2 → Mumbai → instance `i-0c5ef8f09c6555487` → **Start**.
2. Its address is **35.154.6.55** (Elastic IP; check EC2 shows the same).
3. Hostinger hPanel → Domains → mdgservices.in → DNS → edit the **A** record
   `api` → paste that address → save.
4. Nothing else. AWS promotes itself; if Oracle comes back it demotes itself.

## Planned switch (how AWS → Oracle was done, 21 Oct 2026, 16:02–16:06 IST)

Zero dropped requests, zero runs lost. Reverse the box names to go the other way.

1. **Old box forwards to the new one.** `sudo cp /etc/nginx/nginx.conf.forward-to-oracle
/etc/nginx/nginx.conf && sudo nginx -t && sudo systemctl reload nginx` on AWS —
   phones still on the old address are served by the new box from now on.
2. **Old box off jobs.** `sudo touch /etc/mdg/hold-standby` on AWS; wait until no run
   is in flight (a run cut here is retried, but why cut one).
3. **Move the record** (Hostinger, `api` A → new address, TTL 60).
4. **New box on jobs now**, without waiting for every name server: `sudo touch
/etc/mdg/force-primary` on the new box.
5. Once `dig +short api.mdgservices.in @ns1.dns-parking.com` and `@ns2…` both show the
   new address: remove both override files. The role switch takes over again.
6. **Old box serves itself again**: copy `nginx.conf.normal` back over `nginx.conf`
   and reload — a backup that forwards to the box it is backing up is no backup.
   Then stop (never terminate) the old box.

## Going back to Oracle afterwards

The planned switch above, with AWS as the old box.

## A restart never loses a run

A deploy, a crash, a reboot or a role switch can cut a run off mid-way. What happens:

| What was cut                                    | What happens next                                                                                                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A scheduled run on **this** server              | Every run records the machine and process that started it. On every boot (live or standby) the backend closes runs whose process is gone as `RUN_INTERRUPTED` and puts them back in the queue: retried within ~1 minute on whichever box is live. |
| A run on the **other** server                   | Left alone — it may still be going while DNS spreads. Its 29-minute lease runs out and it is retried then: late, never doubled onto the same IndianOil login. That server closes its own on its next boot.                                        |
| A run from before 21 Oct 16:36 IST (no stamp)   | Same as the other server: retried when the lease runs out.                                                                                                                                                                                        |
| The 00:20 Kavach refresh, the hourly daily list | Both run once a minute after the scheduler starts. The daily list goes at the dealer's hour or up to 2 hours after; still once a day.                                                                                                             |
| The 09:00 register-photo ask                    | Had its own catch-up already.                                                                                                                                                                                                                     |

The water-ingress write is safe to repeat: it reads the portal first and stops at
`ALREADY_RECORDED` if the window is marked.

## Deploying from now on

- **Dealer Kavach backend** (Oracle):
  `ssh -i .secrets/oracle-free.key ubuntu@92.4.88.49 'export NVM_DIR=$HOME/.nvm; . $NVM_DIR/nvm.sh; cd ~/mdg-backend && bash deploy.sh'`
  (about a minute end to end; no swap tricks needed). Run it detached
  (`nohup bash deploy.sh > ~/deploy.log 2>&1 &`) so a dropped SSH session cannot
  kill it, and ideally between runs — the scheduler claims due runs at each
  minute's :00, so `nextRunAt` in the database is not the start time.
- **Khata Kavach API**:
  `KK_HOST=ubuntu@92.4.88.49 KK_KEY=../.secrets/oracle-free.key bash infra/deploy.sh`
  (from `khata-kavach/`; the script's default still names the AWS box).
- **The stopped backup stays current by itself.** Whenever the live box's built
  code, settings, Khata Kavach release or certificate changes (and nightly at
  04:00 IST), `mdg-standby-push` packs them, locks them with a key that exists
  only on the two servers, and stores the package in S3 (`mdg-chat/ops/standby/`,
  private; last 5 kept). When the backup boots, `mdg-standby-pull` applies it
  before the apps start — same commit, the live box's BUILT code (so the small
  box never compiles), settings with jobs OFF until the role switch promotes it,
  and the newer certificate. The live box never pulls. Any failure — packing on
  the live box or applying on the backup — is pushed to the phone; the backup
  starts with what it has. (Both jobs run as root under systemd with no `HOME`;
  they set one before loading nvm, which otherwise dies under `set -u` — the
  reason every automatic push failed silently for the first hour on 21 Oct.)
- **Check the package is current** after any deploy:
  `ssh -i .secrets/mdg-aws.pem ubuntu@35.154.6.55 'sudo mdg-standby-pull --check'`
  (dry run, needs AWS running; prints the package's commit beside the box's own).

## Files

| File                                                                           | Installs to                                      | Purpose                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------- |
| `oracle/01-base.sh`                                                            | —                                                | OS setup: swap, firewall, Node 24.13 + pm2 7.0.1, logrotate         |
| `oracle/mem-floor.py` + `mdg-mem-floor.service`                                | `/usr/local/lib/mdg/`, systemd                   | anti-reclaim memory floor                                           |
| `oracle/mdg-role.sh` + `mdg-role.service`                                      | `/usr/local/sbin/mdg-role`, systemd              | role switch + watchdog (both boxes; config in `/etc/mdg/role.conf`) |
| `oracle/mdg-standby-push.sh` / `-pull.sh` / `s3.cjs` / `mdg-standby-units.txt` | `/usr/local/sbin`, `/usr/local/lib/mdg`, systemd | keep the stopped backup current (both boxes)                        |
| `monitor/lambda_function.py` + `deploy.sh` + `allow_url.py`                    | AWS Lambda (account 397572991391)                | outside monitor + one-tap failover; you run `deploy.sh` (AWS guard) |

Useful checks:

```bash
# which box is live, as the internet sees it
dig +short api.mdgservices.in @ns1.dns-parking.com
# role + watchdog log on a box
ssh … 'journalctl -u mdg-role -n 20 -o cat'
# memory floor
ssh … 'journalctl -u mdg-mem-floor -n 3 -o cat'
```
