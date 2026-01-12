#!/usr/bin/env bash
set -euo pipefail

profile="${AWS_PROFILE:-techdev}"
region="${AWS_REGION:-ca-central-1}"
log_group="${LOG_GROUP:-/aws/lambda/sst-console-issue-em72a48731g8undliq7agwu3}"
since_hours="${SINCE_HOURS:-5}"

start_time_ms="$(
  python3 - <<PY
import time
print(int((time.time() - (${since_hours} * 3600)) * 1000))
PY
)"

tmpfile="$(mktemp)"
cleanup() {
  rm -f "$tmpfile"
}
trap cleanup EXIT

AWS_PAGER="" aws logs filter-log-events \
  --log-group-name "$log_group" \
  --start-time "$start_time_ms" \
  --filter-pattern "awslogs" \
  --region "$region" \
  --profile "$profile" \
  --max-items 1000 \
  --no-cli-pager \
  --output json > "$tmpfile"

SST_ISSUE_JSON="$tmpfile" python3 - <<'PY'
import base64
import gzip
import json
import os
import re
import sys

path = os.environ.get("SST_ISSUE_JSON")
if not path:
    print("Missing SST_ISSUE_JSON path.")
    sys.exit(1)

raw = open(path, "r", encoding="utf-8").read()
if not raw.strip():
    print("No log data received from AWS CLI (empty output).")
    sys.exit(0)

data = json.loads(raw)
messages = [event.get("message", "") for event in data.get("events", [])]

aws_data = None
for msg in reversed(messages):
    match = re.search(r'"awslogs"\s*:\s*\{\s*"data"\s*:\s*"([^"]+)"', msg)
    if match:
        aws_data = match.group(1)
        break

if not aws_data:
    print("No awslogs.data payload found in the last 200 events.")
    sys.exit(0)

decoded = gzip.decompress(base64.b64decode(aws_data)).decode("utf-8", "replace")
payload = json.loads(decoded)
events = payload.get("logEvents", [])

def is_issue(message: str) -> bool:
    lowered = message.lower()
    return "error" in lowered or "exception" in lowered or "drizzle" in lowered

issue = None
for event in reversed(events):
    if is_issue(event.get("message", "")):
        issue = event
        break

result = {
    "logGroup": payload.get("logGroup"),
    "logStream": payload.get("logStream"),
    "event": issue or (events[-1] if events else None),
}
print(json.dumps(result, indent=2))
PY
