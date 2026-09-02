#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/frontend"

if [ ! -d "node_modules" ]; then
    npm install
fi

echo "✨ Starting VidGuru AI Frontend on http://localhost:3000..."
npm run dev
