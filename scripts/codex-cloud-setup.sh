#!/usr/bin/env bash
set -euo pipefail

npm install

if [[ "${CODEX_START_POSTGRES:-0}" == "1" ]]; then
  bash scripts/start-dev-postgres.sh
fi

npx prisma generate
