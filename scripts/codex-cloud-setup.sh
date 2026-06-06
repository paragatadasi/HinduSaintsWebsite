#!/usr/bin/env bash
set -euo pipefail

npm install
npx prisma generate
