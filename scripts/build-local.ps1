$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "stop-dev.ps1")
npm run db:generate
npm run build
