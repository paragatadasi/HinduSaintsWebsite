#!/bin/sh
set -eu

timestamp="$(date +%Y%m%d-%H%M%S)"
pg_dump "$DATABASE_URL" > "/backups/saints-${timestamp}.sql"
find /backups -type f -name "saints-*.sql" -mtime +14 -delete
