#!/bin/sh
# Start WireMock and reload filesystem mappings (WireMock does not watch mapping files).
set -e

/docker-entrypoint.sh "$@" &
pid=$!

i=0
while [ "$i" -lt 60 ]; do
  if wget -q -spider http://127.0.0.1:8080/__admin/health 2>/dev/null; then
    wget -q -O /dev/null --post-data='' http://127.0.0.1:8080/__admin/mappings/reset 2>/dev/null || true
    break
  fi
  i=$((i + 1))
  sleep 1
done

wait "$pid"
