#!/usr/bin/env bash
# start.sh — boot the Dealer Kavach dev stack (backend + frontend).
#
# What it does:
#   1. Verifies prerequisites (Node 20+, npm).
#   2. Refuses to start if ports 4000 or 5173 are already in use.
#   3. Creates backend/.env and frontend/.env from .env.example when missing.
#   4. Installs npm dependencies if node_modules is missing.
#   5. Starts backend and frontend concurrently via `npm run dev`, in the
#      background, redirecting output to .runtime/dev.log.
#   6. Waits up to ~90s for both /health (backend) and / (frontend) to respond.
#   7. Writes the process group PID to .runtime/dev.pid so stop.sh can clean up.
#
# Usage:
#   scripts/start.sh           # start the stack
#   scripts/start.sh --foreground   # run in the foreground (Ctrl+C to stop)
#
# Exit codes:
#   0  - stack is up
#   1  - prerequisite missing or boot failed
#   2  - already running (ports in use or pidfile present)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RUNTIME_DIR="$REPO_ROOT/.runtime"
LOG_FILE="$RUNTIME_DIR/dev.log"
PID_FILE="$RUNTIME_DIR/dev.pid"
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
READY_TIMEOUT="${READY_TIMEOUT:-90}"

FOREGROUND=0
for arg in "$@"; do
  case "$arg" in
    --foreground|-f) FOREGROUND=1 ;;
    --help|-h)
      sed -n '2,/^$/p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
ok()    { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn()  { printf '\033[33m!\033[0m %s\n' "$*"; }
fail()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; }

# ---- prerequisites ---------------------------------------------------------

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "$1 is not installed or not on PATH"
    exit 1
  fi
}
require_cmd node
require_cmd npm
require_cmd curl

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node 20+ required (found $(node --version))"
  exit 1
fi

# ---- already running guard -------------------------------------------------

port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

if port_in_use "$BACKEND_PORT" || port_in_use "$FRONTEND_PORT"; then
  fail "Port $BACKEND_PORT or $FRONTEND_PORT is already in use."
  warn "Run scripts/stop.sh first, or check with:  lsof -i :$BACKEND_PORT -i :$FRONTEND_PORT"
  exit 2
fi

if [ -f "$PID_FILE" ]; then
  PREV_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$PREV_PID" ] && kill -0 "$PREV_PID" 2>/dev/null; then
    fail "Dev stack already running (pid $PREV_PID). Run scripts/stop.sh first."
    exit 2
  fi
  warn "Stale pidfile found; removing."
  rm -f "$PID_FILE"
fi

mkdir -p "$RUNTIME_DIR"

# ---- env files -------------------------------------------------------------

ensure_env() {
  local example="$1"
  local target="${example%.example}"
  if [ ! -f "$target" ] && [ -f "$example" ]; then
    cp "$example" "$target"
    warn "Created $target from $example — edit secrets before production use."
  fi
}
ensure_env backend/.env.example
ensure_env frontend/.env.example

if [ ! -f backend/.env ]; then
  fail "backend/.env is missing and no example was found."
  exit 1
fi
if ! grep -q '^MONGODB_URI=' backend/.env; then
  fail "backend/.env is missing MONGODB_URI."
  exit 1
fi

# ---- deps ------------------------------------------------------------------

if [ ! -d node_modules ]; then
  bold "Installing npm dependencies (first run)…"
  npm install
  ok "Dependencies installed"
fi

# ---- start -----------------------------------------------------------------

bold "Starting Dealer Kavach…"
echo "  backend  → http://localhost:$BACKEND_PORT"
echo "  frontend → http://localhost:$FRONTEND_PORT"
echo "  log file → $LOG_FILE"

if [ "$FOREGROUND" -eq 1 ]; then
  exec npm run dev
fi

# Background mode. We disown the child so it survives this shell exiting,
# and record its PID so stop.sh can find and kill the tree. `concurrently -k`
# already propagates SIGTERM to its children; stop.sh also has a port-based
# fallback in case anything escapes.
: > "$LOG_FILE"
nohup npm run dev >>"$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" >"$PID_FILE"
disown "$PID" 2>/dev/null || true
echo "Started pid $PID."

# ---- readiness probe -------------------------------------------------------

wait_ready() {
  local deadline=$(( $(date +%s) + READY_TIMEOUT ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    if curl -fsS "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1 \
      && curl -fsS "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
      return 0
    fi
    if ! kill -0 "$PID" 2>/dev/null; then
      return 2
    fi
    sleep 1
  done
  return 1
}

if wait_ready; then
  ok "Backend healthy  → http://localhost:$BACKEND_PORT/health"
  ok "Frontend serving → http://localhost:$FRONTEND_PORT"
  echo
  echo "Tail logs:  tail -f $LOG_FILE"
  echo "Stop:       scripts/stop.sh"
  exit 0
fi

rc=$?
if [ "$rc" -eq 2 ]; then
  fail "Dev process exited during boot. Last 40 lines of $LOG_FILE:"
else
  fail "Timed out after ${READY_TIMEOUT}s waiting for the stack to come up. Last 40 lines of $LOG_FILE:"
fi
tail -40 "$LOG_FILE" >&2 || true
"${REPO_ROOT}/scripts/stop.sh" --quiet >/dev/null 2>&1 || true
exit 1
