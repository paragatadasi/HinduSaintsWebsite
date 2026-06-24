param(
  [int] $Port = 5432
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $workspace "infra\docker-compose.yml"
$dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

function Test-PortListening {
  param([int] $LocalPort)

  $netstatLines = netstat -ano | Select-String -Pattern ":$LocalPort\s+.*LISTENING\s+(\d+)"
  return [bool] $netstatLines
}

if (Test-PortListening -LocalPort $Port) {
  Write-Host "Postgres appears to be listening on localhost:$Port."
  exit 0
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker CLI is not available. Start PostgreSQL manually or install Docker Desktop."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  if (-not (Test-Path $dockerDesktop)) {
    throw "Docker is not running, and Docker Desktop was not found at '$dockerDesktop'."
  }

  Write-Host "Starting Docker Desktop..."
  Start-Process -FilePath $dockerDesktop -WindowStyle Hidden

  $ready = $false
  for ($attempt = 1; $attempt -le 60; $attempt++) {
    Start-Sleep -Seconds 2
    docker info *> $null
    if ($LASTEXITCODE -eq 0) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    throw "Docker did not become ready. Open Docker Desktop and try again."
  }
}

docker compose -f $composeFile up -d postgres

for ($attempt = 1; $attempt -le 30; $attempt++) {
  if (Test-PortListening -LocalPort $Port) {
    Write-Host "Postgres is listening on localhost:$Port."
    exit 0
  }
  Start-Sleep -Seconds 1
}

throw "Postgres did not start listening on localhost:$Port in time."
