#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "🎓 Starting VidGuru AI Platform (Backend + Frontend)..."

# Trap Ctrl+C to kill background processes
trap 'kill $(jobs -p) 2>/dev/null || true; exit' SIGINT SIGTERM EXIT

bash "$DIR/run_backend.sh" &
BACKEND_PID=$!

bash "$DIR/run_frontend.sh" &
FRONTEND_PID=$!

wait
