"""Give the monitor's Function URL the second permission AWS requires since Oct 2025.

A public (AuthType NONE) function URL needs BOTH lambda:InvokeFunctionUrl and
lambda:InvokeFunction on the function's resource policy. The second one is
granted with InvokedViaFunctionUrl=True, so it only works THROUGH the URL — nobody
can call the function any other way. The code still refuses anything without the
secret key, and only a POST can start a failover.

The AWS CLI on this Mac (2.17) predates that option, so this uses current boto3:
    AWS_PROFILE=mdg ops/monitor/.venv/bin/python ops/monitor/allow_url.py
Safe to re-run.
"""
import boto3

lam = boto3.session.Session(region_name="ap-south-1").client("lambda")
try:
    lam.add_permission(
        FunctionName="mdg-monitor",
        StatementId="public-url-invoke",
        Action="lambda:InvokeFunction",
        Principal="*",
        InvokedViaFunctionUrl=True,
    )
    print("added: invoke allowed only via the function URL")
except lam.exceptions.ResourceConflictException:
    print("already present")
