# Auto-commit script for Delphi project (PowerShell version)
# Usage: .\scripts\auto-commit.ps1 "commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 Starting auto-commit process..." -ForegroundColor Green

# Check if we're in a git repository
try {
    git status | Out-Null
} catch {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run: git init" -ForegroundColor Yellow
    exit 1
}

# Check if remote exists
try {
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl) {
        Write-Host "✅ Remote origin is configured: $remoteUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No remote origin found. Run scripts/ensure-remote.mjs to set up remote." -ForegroundColor Yellow
}

# Stage all changes
Write-Host "📦 Staging all changes..." -ForegroundColor Blue
git add -A

# Check if there are changes to commit
$stagedChanges = git diff --cached --name-only
if ([string]::IsNullOrEmpty($stagedChanges)) {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Commit changes
Write-Host "💾 Committing: `"$CommitMessage`"" -ForegroundColor Blue
git commit -m $CommitMessage

# Push to remote
Write-Host "🚀 Pushing to remote..." -ForegroundColor Blue
try {
    git push origin HEAD
    Write-Host "✅ Successfully committed and pushed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Commit successful, but push failed. You may need to set up remote or check permissions." -ForegroundColor Yellow
    Write-Host "Run: git remote add origin <your-repo-url>" -ForegroundColor Yellow
}
