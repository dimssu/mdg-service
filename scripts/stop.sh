#!/usr/bin/env bash
# stop.sh — shut down the Dealer Kavach dev stack started by start.sh.
#
# What it does:
#   1. Reads .runtime/dev.pid (the process group started by start.sh).
#   2. Sends SIGTERM to that process group, escalating to SIGKILL after a
#      grace period.
#   3. Falls back to scanning ports 4000 / 5173 and killing any listening
#      process if no pidfile exists or the pidfile is stale.
#
# Usage:
#   scripts/stop.sh           # verbose
#   scripts/stop.sh --quiet   # suppress non-error output
#
# Exit codes:
#   0 - stack stopped (or wasn't running)
#   1 - failed to stop something we expected to kill

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RUNTIME_DIR="$REPO_ROOT/.runtime"
PID_FILE="$RUNTIME_DIR/dev.pid"
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
GRACE_SECONDS="${GRACE_SECONDS:-5}"

QUIET=0
for arg in "$@"; do
  case "$arg" in
    --quiet|-q) QUIET=1 ;;
    --help|-h)
      sed -n '2,/^$/p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

log()   { [ "$QUIET" -eq 1 ] || printf '%s\n' "$*"; }
ok()    { [ "$QUIET" -eq 1 ] || printf '\033[32m✓\033[0m %s\n' "$*"; }
warn()  { [ "$QUIET" -eq 1 ] || printf '\033[33m!\033[0m %s\n' "$*"; }
fail()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; }

# Collect descendant PIDs of $1 (depth-first). Portable to macOS + Linux.
descendants() {
  local parent="$1"
  local children
  children="$(pgrep -P "$parent" 2>/dev/null || true)"
  for c in $children; do
    descendants "$c"
    printf '%s\n' "$c"
  done
}

stop_tree() {
  local pid="$1"
  if ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi
  # Gather descendants first (children disappear once parent dies).
  local kids
  kids="$(descendants "$pid")"
  kill -TERM "$pid" 2>/dev/null || true
  # shellcheck disable=SC2086
  [ -n "$kids" ] && kill -TERM $kids 2>/dev/null || true
  local deadline=$(( $(date +%s) + GRACE_SECONDS ))
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$(date +%s)" -ge "$deadline" ]; then
      warn "Process $pid did not exit after ${GRACE_SECONDS}s; sending SIGKILL."
      kill -KILL "$pid" 2>/dev/null || true
      # shellcheck disable=SC2086
      [ -n "$kids" ] && kill -KILL $kids 2>/dev/null || true
      break
    fi
    sleep 0.2
  done
  return 0
}

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -z "$pids" ]; then return 1; fi
  warn "Port $port still has listeners ($pids); terminating."
  # shellcheck disable=SC2086
  kill -TERM $pids 2>/dev/null || true
  sleep 1
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill -KILL $pids 2>/dev/null || true
  fi
  return 0
}

stopped=0

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$PID" ]; then
    if stop_tree "$PID"; then
      ok "Stopped pid $PID"
      stopped=1
    else
      warn "Pidfile pointed at $PID but it wasn't running."
    fi
  fi
  rm -f "$PID_FILE"
fi

# Belt-and-braces: kill anything still bound to the dev ports.
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if stop_port "$port"; then stopped=1; fi
done

if [ "$stopped" -eq 1 ]; then
  ok "Dev stack stopped."
else
  log "Nothing to stop — no pidfile and no listeners on $BACKEND_PORT / $FRONTEND_PORT."
fi

# Final sanity check.
if lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1 \
  || lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  fail "Port $BACKEND_PORT or $FRONTEND_PORT is still in use after stop."
  exit 1
fi
exit 0
