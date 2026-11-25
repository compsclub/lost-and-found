#!/usr/bin/env bash
# Start the API and the static server in one container.
#
# The static server owns the published port and proxies /api/v1 to the API on
# loopback, so the container presents a single origin to Caddy. Both processes
# are supervised: if either one exits the container stops, so Docker's restart
# policy can bring back a healthy pair instead of serving a half-broken app.
set -euo pipefail

export PORT="${PORT:-3100}"
export HOST="${HOST:-127.0.0.1}"
export PREVIEW_PORT="${PREVIEW_PORT:-8080}"
export API_TARGET="${API_TARGET:-http://127.0.0.1:${PORT}}"

node dist/core/index.js &
api_pid=$!

node dist/preview/server.js &
web_pid=$!

cleanup() {
    kill "$api_pid" "$web_pid" 2>/dev/null || true
    wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Return as soon as either process stops so the container does not linger.
wait -n "$api_pid" "$web_pid"
