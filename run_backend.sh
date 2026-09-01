#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    venv/bin/pip install -r requirements.txt
fi

export PYTHONPATH="$DIR/backend"
echo "🚀 Starting VidGuru AI Backend on http://localhost:8005..."
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
