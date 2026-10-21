#!/usr/bin/env bash
# Installs (or updates) the MDG uptime monitor + one-tap failover in the MDG AWS
# account (397572991391, Mumbai). Safe to re-run: every step checks before it
# creates. Run it yourself from the repo root:
#
#   AWS_PROFILE=mdg ALERT_EMAIL=you@example.com bash ops/monitor/deploy.sh
#
# What it creates — all inside AWS's free allowances:
#   * Lambda function  mdg-monitor        the checker + failover (runs ~31 s a minute)
#   * EventBridge rule mdg-monitor-every-minute
#   * Function URL     the "Start AWS backup" button calls it; key-protected,
#                      POST-only for failover
#   * IAM role         mdg-monitor-role   can ONLY: start i-0c5ef8f09c6555487, read
#                      server state, publish to mdg-alerts, read/write /mdg/monitor/*
#   * SNS topic        mdg-alerts         emails you (confirm the email AWS sends)
#   * SSM parameter    /mdg/monitor/state the monitor's memory between runs
#   * 2 CloudWatch alarms that email you if the monitor itself errors or stops
#   * Deletion protection ON for i-0c5ef8f09c6555487 (a stray "Terminate" fails)
# It does NOT touch the running server, its disk, its address or Oracle.
set -euo pipefail
cd "$(dirname "$0")"
: "${AWS_PROFILE:?run with AWS_PROFILE=mdg}"
: "${ALERT_EMAIL:?run with ALERT_EMAIL=<address for alert emails>}"
export AWS_REGION=ap-south-1 AWS_PAGER=""
SECRETS=../../.secrets
NAME=mdg-monitor
INSTANCE=i-0c5ef8f09c6555487
ORACLE_IP=92.4.88.49

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[ "$ACCOUNT" = 397572991391 ] || { echo "Wrong AWS account ($ACCOUNT). Use the MDG profile." >&2; exit 1; }
echo "== account $ACCOUNT, server $(aws ec2 describe-instances --instance-ids $INSTANCE --query 'Reservations[0].Instances[0].State.Name' --output text)"

NTFY_URL="https://ntfy.sh/$(cat "$SECRETS/ntfy-topic.txt")"
TOKEN_FILE="$SECRETS/failover-token.txt"
[ -s "$TOKEN_FILE" ] || python3 -I -c "import secrets;print(secrets.token_urlsafe(32))" > "$TOKEN_FILE"
chmod 600 "$TOKEN_FILE"
FAILOVER_TOKEN=$(cat "$TOKEN_FILE")
HOSTINGER_TOKEN=$(cat "$SECRETS/hostinger-api-token.txt")

echo "== 1/8 deletion protection on the backup server"
aws ec2 modify-instance-attribute --instance-id $INSTANCE --disable-api-termination

echo "== 2/8 email alerts (SNS)"
TOPIC_ARN=$(aws sns create-topic --name mdg-alerts --query TopicArn --output text)
if ! aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --query 'Subscriptions[].Endpoint' --output text | grep -qi "$ALERT_EMAIL"; then
  aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint "$ALERT_EMAIL" >/dev/null
  echo "   confirmation email sent to $ALERT_EMAIL"
fi

echo "== 3/8 least-privilege role"
TRUST='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
ROLE_ARN=$(aws iam get-role --role-name $NAME-role --query Role.Arn --output text 2>/dev/null) || {
  ROLE_ARN=$(aws iam create-role --role-name $NAME-role --assume-role-policy-document "$TRUST" --query Role.Arn --output text)
  NEW_ROLE=1; }
aws iam attach-role-policy --role-name $NAME-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy --role-name $NAME-role --policy-name $NAME-least-privilege --policy-document "{
  \"Version\":\"2012-10-17\",\"Statement\":[
  {\"Effect\":\"Allow\",\"Action\":[\"ssm:GetParameter\",\"ssm:PutParameter\"],\"Resource\":\"arn:aws:ssm:$AWS_REGION:$ACCOUNT:parameter/mdg/monitor/*\"},
  {\"Effect\":\"Allow\",\"Action\":\"sns:Publish\",\"Resource\":\"$TOPIC_ARN\"},
  {\"Effect\":\"Allow\",\"Action\":\"ec2:DescribeInstances\",\"Resource\":\"*\"},
  {\"Effect\":\"Allow\",\"Action\":\"ec2:StartInstances\",\"Resource\":\"arn:aws:ec2:$AWS_REGION:$ACCOUNT:instance/$INSTANCE\"}]}"
[ -n "${NEW_ROLE:-}" ] && { echo "   waiting 10 s for the new role to spread"; sleep 10; }

env_json() { python3 -I -c 'import json,sys; print(json.dumps({"Variables": dict(a.split("=",1) for a in sys.argv[1:])}))' \
  "NTFY_URL=$NTFY_URL" "SNS_TOPIC_ARN=$TOPIC_ARN" "FAILOVER_TOKEN=$FAILOVER_TOKEN" \
  "AWS_STANDBY_INSTANCE=$INSTANCE" "ORACLE_IP=$ORACLE_IP" "HOSTINGER_TOKEN=$HOSTINGER_TOKEN" \
  "FUNCTION_URL=${1:-}"; }

echo "== 4/8 the monitor (Lambda)"
ZIP=$(mktemp -d)/$NAME.zip
zip -q -j "$ZIP" lambda_function.py
if aws lambda get-function --function-name $NAME >/dev/null 2>&1; then
  aws lambda update-function-code --function-name $NAME --zip-file "fileb://$ZIP" >/dev/null
else
  aws lambda create-function --function-name $NAME --runtime python3.12 --handler lambda_function.lambda_handler \
    --role "$ROLE_ARN" --zip-file "fileb://$ZIP" --timeout 300 --memory-size 128 --environment "$(env_json)" >/dev/null
  aws lambda wait function-active-v2 --function-name $NAME
fi
aws lambda wait function-updated-v2 --function-name $NAME
# No reserved-concurrency cap: this account's total is 10, the floor AWS keeps
# unreserved, so reserving any would fail. That account-wide 10 is the cap; a
# wrong key is refused in milliseconds and 1M requests a month are free.
aws logs create-log-group --log-group-name /aws/lambda/$NAME 2>/dev/null || true
aws logs put-retention-policy --log-group-name /aws/lambda/$NAME --retention-in-days 14

echo "== 5/8 the button's link (Function URL)"
FURL=$(aws lambda get-function-url-config --function-name $NAME --query FunctionUrl --output text 2>/dev/null) || \
  FURL=$(aws lambda create-function-url-config --function-name $NAME --auth-type NONE --query FunctionUrl --output text)
aws lambda add-permission --function-name $NAME --statement-id public-url --action lambda:InvokeFunctionUrl \
  --principal '*' --function-url-auth-type NONE >/dev/null 2>&1 || true
# Since Oct 2025 a public URL also needs lambda:InvokeFunction, granted only via the URL.
[ -x .venv/bin/python ] || { python3 -m venv .venv && .venv/bin/pip install -q --upgrade boto3; }
.venv/bin/python allow_url.py
aws lambda update-function-configuration --function-name $NAME --environment "$(env_json "$FURL")" >/dev/null
aws lambda wait function-updated-v2 --function-name $NAME

echo "== 6/8 run every minute"
RULE_ARN=$(aws events put-rule --name $NAME-every-minute --schedule-expression 'rate(1 minute)' --query RuleArn --output text)
aws lambda add-permission --function-name $NAME --statement-id every-minute --action lambda:InvokeFunction \
  --principal events.amazonaws.com --source-arn "$RULE_ARN" >/dev/null 2>&1 || true
aws events put-targets --rule $NAME-every-minute --targets "Id=1,Arn=arn:aws:lambda:$AWS_REGION:$ACCOUNT:function:$NAME" >/dev/null

echo "== 7/8 watch the watcher"
aws cloudwatch put-metric-alarm --alarm-name $NAME-errors --alarm-description "The MDG monitor is failing" \
  --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=$NAME --statistic Sum \
  --period 300 --evaluation-periods 2 --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching --alarm-actions "$TOPIC_ARN" --ok-actions "$TOPIC_ARN"
aws cloudwatch put-metric-alarm --alarm-name $NAME-not-running --alarm-description "The MDG monitor has stopped running" \
  --namespace AWS/Lambda --metric-name Invocations --dimensions Name=FunctionName,Value=$NAME --statistic Sum \
  --period 600 --evaluation-periods 1 --threshold 1 --comparison-operator LessThanThreshold \
  --treat-missing-data breaching --alarm-actions "$TOPIC_ARN" --ok-actions "$TOPIC_ARN"

echo "== 8/8 first check, right now"
aws lambda invoke --function-name $NAME --cli-binary-format raw-in-base64-out --payload '{"mdg":"probe"}' /dev/stdout 2>/dev/null | head -c 300; echo
echo "$FURL" > "$SECRETS/monitor-url.txt"
echo
echo "DONE. Status page: open .secrets/monitor-url.txt and add ?action=status&token=<.secrets/failover-token.txt>"
aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --query 'Subscriptions[].SubscriptionArn' --output text | grep -q PendingConfirmation \
  && echo "Now open the email from AWS at $ALERT_EMAIL and click 'Confirm subscription'." \
  || echo "Alert email $ALERT_EMAIL: confirmed."
