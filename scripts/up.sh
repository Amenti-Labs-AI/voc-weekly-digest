#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Refreshing workflow artifacts via setup service ..."
docker compose up --build --force-recreate --no-deps setup

echo "Starting runtime services ..."
docker compose up -d wiremock n8n

echo "Done."
echo "n8n: http://localhost:5678"
echo "viewer: http://localhost:8080/mock/demo/render/view"
