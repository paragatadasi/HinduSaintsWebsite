param(
    [string]$Path = "",
    [string]$BaseRef = "origin/main",
    [string]$Branch = "codex/release-verify"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param(
        [string[]]$Arguments,
        [string]$WorkingDirectory = $RepoRoot
    )

    & git -c "safe.directory=$RepoRoot" @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Get-FileSha256 {
    param([string]$FilePath)

    return (Get-FileHash -LiteralPath $FilePath -Algorithm SHA256).Hash.ToLowerInvariant()
}

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path

if (-not $Path) {
    if ($env:SAINTS_RELEASE_WORKTREE) {
        $Path = $env:SAINTS_RELEASE_WORKTREE
    }
    else {
        $Path = Join-Path (Split-Path -Parent $RepoRoot) "Saints Website Release Verify"
    }
}

$WorktreePath = [System.IO.Path]::GetFullPath($Path)
$LockFile = Join-Path $WorktreePath "package-lock.json"
$NodeModules = Join-Path $WorktreePath "node_modules"
$HashFile = Join-Path $NodeModules ".release-package-lock.sha256"

Write-Output "Release verification worktree: $WorktreePath"
Write-Output "Base ref: $BaseRef"

Invoke-Git -Arguments @("fetch", "origin", "main", "deploy")

if (-not (Test-Path -LiteralPath $WorktreePath)) {
    Invoke-Git -Arguments @("worktree", "add", "-B", $Branch, $WorktreePath, $BaseRef)
}
else {
    $status = & git -c "safe.directory=$WorktreePath" -C $WorktreePath status --porcelain
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect existing worktree at $WorktreePath"
    }
    if ($status) {
        throw "Release verification worktree has local changes. Clean or move them before reusing it:`n$status"
    }

    & git -c "safe.directory=$WorktreePath" -C $WorktreePath fetch origin main deploy
    if ($LASTEXITCODE -ne 0) {
        throw "Could not fetch from existing release verification worktree."
    }

    & git -c "safe.directory=$WorktreePath" -C $WorktreePath checkout -B $Branch $BaseRef
    if ($LASTEXITCODE -ne 0) {
        throw "Could not update release verification worktree to $BaseRef."
    }
}

if (-not (Test-Path -LiteralPath $LockFile)) {
    throw "Missing package-lock.json in release verification worktree."
}

$currentHash = Get-FileSha256 -FilePath $LockFile
$previousHash = if (Test-Path -LiteralPath $HashFile) {
    (Get-Content -Raw -LiteralPath $HashFile).Trim().ToLowerInvariant()
}
else {
    ""
}

if ((-not (Test-Path -LiteralPath $NodeModules)) -or ($currentHash -ne $previousHash)) {
    Write-Output "Installing full locked dependencies for release verification..."
    & npm.cmd ci --prefix $WorktreePath
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed with exit code $LASTEXITCODE"
    }
    Set-Content -LiteralPath $HashFile -Value $currentHash -Encoding ascii
}
else {
    Write-Output "Reusing existing full dependency install; package-lock.json is unchanged."
}

Write-Output "Ready: $WorktreePath"
