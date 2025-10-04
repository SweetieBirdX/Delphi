#!/bin/bash

# Auto-commit script for Delphi project (Bash version)
# Usage: ./scripts/auto-commit.sh "commit message"

if [ $# -eq 0 ]; then
    echo "❌ Error: Commit message is required"
    echo "Usage: ./scripts/auto-commit.sh \"your commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 Starting auto-commit process..."

# Check if we're in a git repository
if ! git status > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    echo "Please run: git init"
    exit 1
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote origin found. Run scripts/ensure-remote.mjs to set up remote."
fi

# Stage all changes
echo "📦 Staging all changes..."
git add -A

# Check if there are changes to commit
if [ -z "$(git diff --cached --name-only)" ]; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Commit changes
echo "💾 Committing: \"$COMMIT_MESSAGE\""
git commit -m "$COMMIT_MESSAGE"

# Push to remote
echo "🚀 Pushing to remote..."
if git push origin HEAD; then
    echo "✅ Successfully committed and pushed!"
else
    echo "⚠️  Commit successful, but push failed. You may need to set up remote or check permissions."
    echo "Run: git remote add origin <your-repo-url>"
fi
