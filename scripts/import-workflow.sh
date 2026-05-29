#!/usr/bin/env bash
# Re-import the already-synced VOC workflow into a running n8n container.
set -euo pipefail
cd "$(dirname "$0")/.."

WORKFLOW="/src/n8n/workflows/voc-weekly-digest.json"

if [ -n "${N8N_CONTAINER:-}" ]; then
  CONTAINER="$N8N_CONTAINER"
else
  CONTAINER=$(docker compose ps -q n8n 2>/dev/null | head -1)
  if [ -n "$CONTAINER" ]; then
    CONTAINER=$(docker inspect -f '{{.Name}}' "$CONTAINER" | sed 's/^\///')
  else
    CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'n8n' | head -1 || true)
  fi
fi

if [ -z "$CONTAINER" ] || ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "n8n container not running. Start with: docker compose up -d" >&2
  exit 1
fi

echo "Importing workflow into $CONTAINER from $WORKFLOW ..."
docker exec "$CONTAINER" n8n import:workflow --input="$WORKFLOW"
echo "Done. Refresh http://localhost:5678"
