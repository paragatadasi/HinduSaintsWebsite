#!/usr/bin/env bash
set -euo pipefail

container_name="${CODEX_POSTGRES_CONTAINER:-hindu-saints-dev-postgres}"
postgres_db="${POSTGRES_DB:-hindu_saints_dev}"
postgres_user="${POSTGRES_USER:-saints_dev}"
postgres_password="${POSTGRES_PASSWORD:-saints_dev_password_2026}"
postgres_port="${POSTGRES_PORT:-5432}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not available in this environment."
  echo "Either disable CODEX_START_POSTGRES or configure DATABASE_URL to point at an external development Postgres database."
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -qx "$container_name"; then
  echo "Postgres container '$container_name' is already running."
elif docker ps -a --format '{{.Names}}' | grep -qx "$container_name"; then
  docker start "$container_name" >/dev/null
else
  docker run \
    --name "$container_name" \
    -e POSTGRES_DB="$postgres_db" \
    -e POSTGRES_USER="$postgres_user" \
    -e POSTGRES_PASSWORD="$postgres_password" \
    -p "$postgres_port:5432" \
    -d postgres:16 >/dev/null
fi

echo "Waiting for Postgres to accept connections..."
for attempt in $(seq 1 30); do
  if docker exec "$container_name" pg_isready -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; then
    echo "Postgres is ready on localhost:$postgres_port."
    exit 0
  fi
  sleep 1
done

echo "Postgres did not become ready in time."
docker logs "$container_name" | tail -50
exit 1
