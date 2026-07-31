[CmdletBinding()]
param(
    [switch]$Apply,
    [string]$MainRef = "origin/main"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments,
        [switch]$AllowFailure
    )

    # Codex/Windows can run auxiliary worktrees under a sandbox identity that
    # differs from their filesystem owner. Scope the trust override to this
    # process; do not mutate the user's global Git configuration.
    $output = & git -c "safe.directory=*" -c "core.longpaths=true" @Arguments 2>&1
    $exitCode = $LASTEXITCODE

    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "git $($Arguments -join ' ') failed:`n$($output -join "`n")"
    }

    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output)
    }
}

function Get-RegisteredWorktrees {
    $lines = (Invoke-Git -Arguments @("worktree", "list", "--porcelain")).Output
    $items = [System.Collections.Generic.List[object]]::new()
    $current = $null

    foreach ($line in @($lines) + "") {
        if ($line -like "worktree *") {
            $current = [ordered]@{
                Path = $line.Substring(9)
                Head = $null
                Branch = $null
                Detached = $false
                Locked = $false
                Prunable = $false
            }
        }
        elseif ($null -ne $current -and $line -like "HEAD *") {
            $current.Head = $line.Substring(5)
        }
        elseif ($null -ne $current -and $line -like "branch *") {
            $current.Branch = $line.Substring(7)
        }
        elseif ($null -ne $current -and $line -eq "detached") {
            $current.Detached = $true
        }
        elseif ($null -ne $current -and $line -like "locked*") {
            $current.Locked = $true
        }
        elseif ($null -ne $current -and $line -like "prunable*") {
            $current.Prunable = $true
        }
        elseif ($null -ne $current -and $line -eq "") {
            $items.Add([pscustomobject]$current)
            $current = $null
        }
    }

    return $items
}

Invoke-Git -Arguments @("rev-parse", "--verify", "$MainRef^{commit}") | Out-Null

$worktrees = @(Get-RegisteredWorktrees)
if ($worktrees.Count -eq 0) {
    Write-Output "No registered worktrees found."
    exit 0
}

# Git lists the primary worktree first. Never remove it from this maintenance script.
$primaryPath = [System.IO.Path]::GetFullPath($worktrees[0].Path)
$currentPath = [System.IO.Path]::GetFullPath((Get-Location).Path)
$eligible = [System.Collections.Generic.List[object]]::new()

foreach ($worktree in $worktrees) {
    $resolvedPath = [System.IO.Path]::GetFullPath($worktree.Path)
    $label = if ($worktree.Branch) {
        $worktree.Branch -replace "^refs/heads/", ""
    }
    else {
        "(detached)"
    }

    $reason = $null
    if ($resolvedPath -eq $primaryPath) {
        $reason = "primary worktree"
    }
    elseif ($resolvedPath -eq $currentPath) {
        $reason = "current worktree"
    }
    elseif ($worktree.Locked) {
        $reason = "locked"
    }
    elseif ($worktree.Prunable -or -not (Test-Path -LiteralPath $resolvedPath)) {
        $reason = "missing or prunable; inspect separately"
    }
    else {
        $status = Invoke-Git -Arguments @("-C", $resolvedPath, "status", "--porcelain", "--untracked-files=all")
        if ($status.Output.Count -gt 0 -and ($status.Output -join "").Length -gt 0) {
            $reason = "has tracked or untracked changes"
        }
        else {
            $merged = Invoke-Git -Arguments @("merge-base", "--is-ancestor", $worktree.Head, $MainRef) -AllowFailure
            if ($merged.ExitCode -eq 0) {
                $eligible.Add([pscustomobject]@{
                    Path = $resolvedPath
                    Head = $worktree.Head
                    Label = $label
                })
                Write-Output "[eligible] $resolvedPath [$label]"
                continue
            }
            elseif ($merged.ExitCode -eq 1) {
                $reason = "HEAD is not reachable from $MainRef"
            }
            else {
                throw "Could not compare $($worktree.Head) with ${MainRef}:`n$($merged.Output -join "`n")"
            }
        }
    }

    Write-Output "[skip]     $resolvedPath [$label] - $reason"
}

if ($eligible.Count -eq 0) {
    Write-Output "`nNo worktrees are eligible for removal."
    exit 0
}

if (-not $Apply) {
    Write-Output "`nDry run: $($eligible.Count) worktree(s) are eligible."
    Write-Output "Run 'npm run worktrees:cleanup -- -Apply' to remove them."
    exit 0
}

Write-Output "`nRemoving $($eligible.Count) eligible worktree(s)..."
foreach ($candidate in $eligible) {
    # Revalidate both safety conditions immediately before the destructive action.
    $status = Invoke-Git -Arguments @("-C", $candidate.Path, "status", "--porcelain", "--untracked-files=all")
    if ($status.Output.Count -gt 0 -and ($status.Output -join "").Length -gt 0) {
        Write-Output "[skip]     $($candidate.Path) - changes appeared after the initial check"
        continue
    }

    $merged = Invoke-Git -Arguments @("merge-base", "--is-ancestor", $candidate.Head, $MainRef) -AllowFailure
    if ($merged.ExitCode -ne 0) {
        Write-Output "[skip]     $($candidate.Path) - HEAD is no longer verified against $MainRef"
        continue
    }

    try {
        Invoke-Git -Arguments @("worktree", "remove", $candidate.Path) | Out-Null
        Write-Output "[removed]  $($candidate.Path)"
    }
    catch {
        Write-Warning "Git could not completely remove '$($candidate.Path)'. The remaining candidates will still be processed. $($_.Exception.Message)"
    }
}

Write-Output "`nCleanup complete."
