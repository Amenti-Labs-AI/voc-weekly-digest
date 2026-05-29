#!/bin/sh
# Wraps the official n8n entrypoint and imports the VOC workflow when the API is up.
set -e

IMPORT_FILE="${N8N_IMPORT_WORKFLOW:-/src/n8n/workflows/voc-weekly-digest.json}"
CREDENTIALS_FILE="${N8N_IMPORT_CREDENTIALS:-/tmp/voc-ai-credentials.json}"
DEDUPE_SCRIPT="${N8N_DEDUPE_SCRIPT:-/docker/n8n/dedupe-workflows.js}"
DEDUPE_ENABLED="${N8N_DEDUPE_WORKFLOWS:-false}"

dedupe_workflows() {
  if [ "$DEDUPE_ENABLED" != "true" ]; then
    echo "[voc-digest] Dedupe disabled (N8N_DEDUPE_WORKFLOWS=false)"
    return 0
  fi
  if [ ! -f "$DEDUPE_SCRIPT" ]; then
    echo "[voc-digest] Dedupe script missing — skip" >&2
    return 0
  fi
  echo "[voc-digest] Removing existing \"VOC Weekly Digest\" workflows ..."
  NODE_PATH=/usr/local/lib/node_modules/n8n node "$DEDUPE_SCRIPT" || true
}

generate_credentials_file() {
  : "${VOC_OPENAI_API_KEY:?VOC_OPENAI_API_KEY is required (set real key or 'mock' for demo)}"
  : "${VOC_ANTHROPIC_API_KEY:?VOC_ANTHROPIC_API_KEY is required (set real key or 'mock' for demo)}"

  mkdir -p "$(dirname "$CREDENTIALS_FILE")"
  node - "$CREDENTIALS_FILE" <<'EOF'
const fs = require('fs');
const out = process.argv[2];
const creds = [
  {
    id: 'vocAnthropicApi01',
    name: 'Anthropic API (VOC)',
    type: 'anthropicApi',
    data: {
      apiKey: process.env.VOC_ANTHROPIC_API_KEY,
      url: process.env.VOC_ANTHROPIC_BASE_URL || 'http://wiremock:8080',
    },
  },
  {
    id: 'vocOpenAiApi01',
    name: 'OpenAI API (VOC)',
    type: 'openAiApi',
    data: {
      apiKey: process.env.VOC_OPENAI_API_KEY,
      url: process.env.VOC_OPENAI_BASE_URL || 'http://wiremock:8080/v1',
    },
  },
];
fs.writeFileSync(out, JSON.stringify(creds, null, 2) + '\n');
EOF
}

import_credentials() {
  generate_credentials_file
  echo "[voc-digest] Importing credentials from $CREDENTIALS_FILE ..."
  if n8n import:credentials --input="$CREDENTIALS_FILE"; then
    echo "[voc-digest] Credentials import OK"
  else
    echo "[voc-digest] Credentials import failed" >&2
  fi
}

auto_import() {
  if [ "${N8N_AUTO_IMPORT_WORKFLOW:-true}" = "false" ]; then
    return 0
  fi
  import_credentials
  if [ ! -f "$IMPORT_FILE" ]; then
    echo "[voc-digest] No workflow at $IMPORT_FILE — skip import"
    return 0
  fi
  dedupe_workflows
  echo "[voc-digest] Importing workflow from $IMPORT_FILE ..."
  if n8n import:workflow --input="$IMPORT_FILE"; then
    echo "[voc-digest] Workflow import OK"
  else
    echo "[voc-digest] Workflow import failed (DB may still be initializing)" >&2
  fi
}

run_n8n_with_import() {
  /docker-entrypoint.sh "$@" &
  n8n_pid=$!

  i=0
  while [ "$i" -lt 90 ]; do
    if wget -q --spider http://127.0.0.1:5678/ 2>/dev/null; then
      sleep 2
      auto_import || true
      break
    fi
    i=$((i + 1))
    sleep 2
  done
  wait "$n8n_pid"
}

if [ "$#" -eq 0 ]; then
  run_n8n_with_import
  exit $?
fi

case "$1" in
  n8n)
    run_n8n_with_import "$@"
    exit $?
    ;;
  import:workflow)
    exec /docker-entrypoint.sh "$@"
    ;;
  *)
    exec /docker-entrypoint.sh "$@"
    ;;
esac
