#!/bin/sh
# Sync workflow artifacts before n8n starts.
set -e

cd /repo

if [ ! -x node_modules/.bin/esbuild ]; then
  echo "[setup] Installing dependencies ..."
  npm ci
fi

echo "[setup] Running workflow sync ..."
npm run workflow:sync
echo "[setup] Done"
