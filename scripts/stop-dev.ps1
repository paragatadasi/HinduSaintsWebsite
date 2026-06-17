param(
  [int[]] $Ports = @(3000, 3001, 3002, 3003)
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$currentProcessId = $PID
$processIds = New-Object System.Collections.Generic.HashSet[int]

foreach ($port in $Ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    [void] $processIds.Add([int] $connection.OwningProcess)
  }

  $netstatLines = netstat -ano | Select-String -Pattern ":$port\s+.*LISTENING\s+(\d+)"
  foreach ($line in $netstatLines) {
    $match = [regex]::Match($line.Line, "LISTENING\s+(\d+)")
    if ($match.Success) {
      [void] $processIds.Add([int] $match.Groups[1].Value)
    }
  }
}

try {
  $workspaceNodes = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($workspace) }

  foreach ($process in $workspaceNodes) {
    [void] $processIds.Add([int] $process.ProcessId)
  }
} catch {
  Write-Host "Could not inspect Node command lines; stopping port listeners only."
}

if ($processIds.Count -eq 0) {
  Write-Host "No local dev processes found."
  exit 0
}

foreach ($processId in $processIds) {
  if ($processId -eq $currentProcessId) {
    continue
  }

  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    continue
  }

  Stop-Process -Id $processId -Force
  Write-Host "Stopped process $processId ($($process.ProcessName))."
}
