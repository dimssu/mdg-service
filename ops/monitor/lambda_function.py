"""MDG uptime monitor + one-tap failover. Runs in AWS Lambda, outside both servers.

Two entry points in one function:

* EventBridge, every minute  -> probe(): checks the PUBLIC api.mdgservices.in twice
  (30 s apart), exactly as a phone would. Two failures in a row -> urgent push to
  the phone (ntfy) + email (SNS), with a "Start AWS backup" button. Recovery and a
  daily "monitor alive" note are pushed too.
* Function URL ?action=failover&token=...  -> failover(): starts the stopped AWS
  EC2 standby, waits for its new public IP, points api.mdgservices.in at it on
  Hostinger, and reports each step. The boxes' own mdg-role then promotes AWS
  and demotes Oracle (if it is still alive). ?action=status shows the state.

State lives in one SSM parameter so consecutive runs remember what they saw.
Python stdlib + boto3 only (both built into the Lambda runtime).
"""
import hmac
import json
import os
import socket
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

import boto3

PUBLIC = os.environ.get("PUBLIC_HOST", "api.mdgservices.in")
CHECKS = [("Dealer Kavach", f"https://{PUBLIC}/health"), ("Khata Kavach", f"https://{PUBLIC}/kk/v1/health")]
NTFY_URL = os.environ["NTFY_URL"]
SNS_TOPIC = os.environ.get("SNS_TOPIC_ARN", "")
STATE_PARAM = os.environ.get("STATE_PARAM", "/mdg/monitor/state")
# The failover lock lives in its own parameter: the every-minute probe loads its
# state, sleeps 30 s and saves it, which would overwrite a lock written meanwhile.
LOCK_PARAM = os.environ.get("LOCK_PARAM", "/mdg/monitor/failover-lock")
FAILOVER_TOKEN = os.environ["FAILOVER_TOKEN"]
FUNCTION_URL = os.environ.get("FUNCTION_URL", "")
EC2_INSTANCE = os.environ["AWS_STANDBY_INSTANCE"]
ORACLE_IP = os.environ.get("ORACLE_IP", "92.4.88.49")
HOSTINGER_TOKEN = os.environ.get("HOSTINGER_TOKEN", "")
DOMAIN = os.environ.get("DNS_ZONE", "mdgservices.in")
RECORD = os.environ.get("DNS_RECORD", "api")
DNS_TTL = int(os.environ.get("DNS_TTL", "60"))
IST = timezone(timedelta(hours=5, minutes=30))

ssm = boto3.client("ssm")
sns = boto3.client("sns")
ec2 = boto3.client("ec2")


# ---------- helpers ----------------------------------------------------------
def now_ist():
    return datetime.now(IST).strftime("%d %b %H:%M:%S IST")


def load_state():
    try:
        return json.loads(ssm.get_parameter(Name=STATE_PARAM)["Parameter"]["Value"])
    except ssm.exceptions.ParameterNotFound:
        return {"down": False, "fails": 0}


def save_state(st):
    ssm.put_parameter(Name=STATE_PARAM, Value=json.dumps(st), Type="String", Overwrite=True)


def lock_age():
    try:
        return time.time() - float(ssm.get_parameter(Name=LOCK_PARAM)["Parameter"]["Value"])
    except ssm.exceptions.ParameterNotFound:
        return None


def set_lock(on):
    ssm.put_parameter(Name=LOCK_PARAM, Value=str(time.time() if on else 0), Type="String", Overwrite=True)


UA = "mdg-monitor/1.0 (+https://mdgservices.in)"  # Cloudflare (Hostinger) 403s Python's default UA
PRIORITY = {"min": 1, "low": 2, "default": 3, "high": 4, "urgent": 5}


def push(title, body, priority="default", tags="", actions=None, email=False):
    """Phone push via ntfy's JSON API — UTF-8 safe, so emoji titles work (HTTP
    headers are latin-1 only, which silently broke every titled alert).
    actions: list of dicts, e.g. {"action": "http", "label": ..., "url": ..., "method": "POST", "clear": True}."""
    parsed = urllib.parse.urlparse(NTFY_URL)
    msg = {"topic": parsed.path.strip("/"), "title": title, "message": body,
           "priority": PRIORITY.get(priority, 3), "tags": [t for t in tags.split(",") if t]}
    if actions:
        msg["actions"] = actions
    req = urllib.request.Request(f"{parsed.scheme}://{parsed.netloc}", data=json.dumps(msg).encode(),
                                 headers={"Content-Type": "application/json", "User-Agent": UA}, method="POST")
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:  # never let a push failure hide the email
        print("ntfy failed:", e)
    if email and SNS_TOPIC:
        try:
            sns.publish(TopicArn=SNS_TOPIC, Subject=title.encode("ascii", "ignore").decode().strip()[:99] or "MDG alert",
                        Message=body)
        except Exception as e:
            print("email failed:", e)


def check(url):
    """(ok, detail). ok only for HTTP 200 within 10 s."""
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "mdg-uptime-monitor"})
        with urllib.request.urlopen(req, timeout=10, context=ssl.create_default_context()) as r:
            return r.status == 200, f"HTTP {r.status} in {time.time() - t0:.1f}s"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, f"{type(e).__name__}: {str(e)[:80]}"


def resolve(host):
    try:
        return socket.gethostbyname(host)
    except Exception:
        return "?"


def where(ip):
    return {ORACLE_IP: "Oracle"}.get(ip, f"AWS or other ({ip})")


def failover_link():
    q = urllib.parse.urlencode({"action": "failover", "token": FAILOVER_TOKEN})
    return f"{FUNCTION_URL.rstrip('/')}/?{q}"


def buttons(with_status=True):
    b = [{"action": "http", "label": "Start AWS backup", "url": failover_link(), "method": "POST", "clear": True}]
    if with_status:
        b.append({"action": "view", "label": "Check status",
                  "url": f"{FUNCTION_URL.rstrip('/')}/?action=status&token={FAILOVER_TOKEN}"})
    return b


# ---------- probe (every minute) ---------------------------------------------
def probe():
    st = load_state()
    results = []
    # Two rounds 10 s apart, both must fail to alert. (Was 30 s: that idle wait was
    # most of the bill — 10 s keeps the whole monitor near 15% of Lambda's
    # always-free 400,000 GB-s/month, so it never reaches the account's credits.)
    for attempt in range(2):
        round_ = [(name, *check(url)) for name, url in CHECKS]
        results.append(round_)
        bad = [r for r in round_ if not r[1]]
        st["fails"] = st.get("fails", 0) + 1 if bad else 0
        ip = resolve(PUBLIC)
        if bad and st["fails"] >= 2 and not st.get("down"):
            st.update(down=True, since=now_ist(), notified=time.time())
            detail = "\n".join(f"• {n}: {d}" for n, ok, d in round_)
            push(f"🚨 MDG API DOWN ({where(ip)})",
                 f"{PUBLIC} stopped answering at {st['since']}.\n{detail}\n\n"
                 f"If Oracle is gone, tap 'Start AWS backup' (takes ~3-5 min).",
                 priority="urgent", tags="rotating_light",
                 actions=buttons(), email=True)
        elif bad and st.get("down") and time.time() - st.get("notified", 0) > 600:
            st["notified"] = time.time()   # nag every 10 minutes while down
            push(f"🚨 STILL DOWN since {st['since']}", f"{PUBLIC} is still not answering.",
                 priority="urgent", tags="rotating_light",
                 actions=buttons(with_status=False))
        elif not bad and st.get("down"):
            push(f"✅ MDG API back ({where(ip)})", f"Answering again at {now_ist()} (down since {st.get('since')}).",
                 priority="high", tags="white_check_mark", email=True)
            st.update(down=False, since=None)
        if attempt == 0:
            time.sleep(10)
    # Daily proof that the monitor itself is alive (09:00 IST).
    today = datetime.now(IST).strftime("%Y-%m-%d")
    if datetime.now(IST).hour == 9 and st.get("daily") != today:
        st["daily"] = today
        ip = resolve(PUBLIC)
        push("🟢 MDG monitor alive", f"{PUBLIC} -> {where(ip)}. Last check: "
             + ", ".join(f"{n} {d}" for n, ok, d in results[-1]), priority="min", tags="green_circle")
    save_state(st)
    return {"fails": st["fails"], "down": st.get("down", False)}


# ---------- failover (one tap) -----------------------------------------------
def hostinger(method, path, body=None):
    req = urllib.request.Request(
        f"https://developers.hostinger.com{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {HOSTINGER_TOKEN}", "Content-Type": "application/json",
                 "Accept": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        raw = r.read()
        return json.loads(raw) if raw else {}


def point_dns_at(ip):
    hostinger("PUT", f"/api/dns/v1/zones/{DOMAIN}", {
        "overwrite": True,
        "zone": [{"name": RECORD, "type": "A", "ttl": DNS_TTL, "records": [{"content": ip}]}],
    })


def failover():
    age = lock_age()
    if age is not None and age < 600:
        return {"ok": True, "msg": "A failover is already running (started under 10 minutes ago)."}
    set_lock(True)
    try:
        return _failover(lambda s: None)
    except Exception as e:
        set_lock(False)   # unlock for a retry
        push("❌ FAILOVER FAILED — finish by hand",
             f"The automatic switch stopped: {type(e).__name__}: {str(e)[:200]}\n\n"
             f"By hand: 1) AWS console > EC2 > Mumbai > {EC2_INSTANCE} > Start. "
             f"2) Hostinger > mdgservices.in > DNS > A record '{RECORD}' > set to the server's address (35.154.6.55). "
             f"Or tap the button again to retry.", priority="urgent", tags="x", actions=buttons(), email=True)
        raise


def _failover(_):
    push("⏳ Failover started", "Starting the AWS backup server…", priority="high", tags="hourglass")
    inst = ec2.describe_instances(InstanceIds=[EC2_INSTANCE])["Reservations"][0]["Instances"][0]
    if inst["State"]["Name"] in ("stopped", "stopping"):
        if inst["State"]["Name"] == "stopping":
            ec2.get_waiter("instance_stopped").wait(InstanceIds=[EC2_INSTANCE])
        ec2.start_instances(InstanceIds=[EC2_INSTANCE])
    ec2.get_waiter("instance_running").wait(InstanceIds=[EC2_INSTANCE], WaiterConfig={"Delay": 5, "MaxAttempts": 36})
    ip = ec2.describe_instances(InstanceIds=[EC2_INSTANCE])["Reservations"][0]["Instances"][0].get("PublicIpAddress")
    if not ip:
        push("❌ Failover stuck", "AWS started but has no public IP. Open the AWS console.", priority="urgent")
        return {"ok": False, "msg": "no public ip"}
    if not HOSTINGER_TOKEN:
        push("⚠️ AWS is up — change DNS by hand", f"Point {RECORD}.{DOMAIN} (A record) at {ip} in Hostinger now.",
             priority="urgent", tags="warning", email=True)
        return {"ok": True, "ip": ip, "dns": "manual"}
    point_dns_at(ip)
    push("🔁 DNS switched to AWS", f"{RECORD}.{DOMAIN} -> {ip} (TTL {DNS_TTL}s). The AWS box turns its jobs on "
         f"within ~20 s of seeing it; phones follow within a few minutes.", priority="high", tags="repeat", email=True)
    return {"ok": True, "ip": ip, "dns": "switched"}


def status():
    st = load_state()
    ip = resolve(PUBLIC)
    inst = ec2.describe_instances(InstanceIds=[EC2_INSTANCE])["Reservations"][0]["Instances"][0]
    return {"public_host": PUBLIC, "points_at": where(ip), "aws_standby": inst["State"]["Name"],
            "aws_ip": inst.get("PublicIpAddress"), "monitor": st,
            "checks_now": {n: d for n, (ok, d) in ((n, check(u)) for n, u in CHECKS)}}


# ---------- entry ------------------------------------------------------------
def lambda_handler(event, context):
    if event.get("source") == "aws.events" or event.get("mdg") == "probe":
        return probe()
    qs = event.get("queryStringParameters") or {}
    # Constant-time compare so the key cannot be guessed by timing the answers.
    if not hmac.compare_digest(str(qs.get("token", "")), FAILOVER_TOKEN):
        return {"statusCode": 403, "body": "forbidden"}
    action = qs.get("action", "status")
    method = (event.get("requestContext", {}).get("http", {}) or {}).get("method", "GET")
    if action == "failover":
        # Only a deliberate button press (POST) moves production; a link preview,
        # a browser prefetch or a curious tap on the URL (GET) never does.
        if method != "POST":
            return {"statusCode": 405, "body": "Failover needs the button (POST), not a link open."}
        body = failover()
    elif action == "drill":
        push("🧪 DRILL from the monitor", "This alert came from the monitor itself. Tapping Start AWS backup "
             "now is harmless while AWS is the live server.", priority="high", tags="test_tube", actions=buttons(),
             email=True)
        body = {"ok": True, "sent": "drill"}
    else:
        body = status()
    return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": json.dumps(body, indent=2, default=str)}
