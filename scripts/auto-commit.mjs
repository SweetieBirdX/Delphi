#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Auto-commit script for Delphi project
 * Usage: node scripts/auto-commit.mjs "commit message"
 */

const args = process.argv.slice(2);
const commitMessage = args[0];

if (!commitMessage) {
  console.error('❌ Error: Commit message is required');
  console.log('Usage: node scripts/auto-commit.mjs "your commit message"');
  process.exit(1);
}

try {
  console.log('🚀 Starting auto-commit process...');
  
  // Check if we're in a git repository
  try {
    execSync('git status', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Error: Not in a git repository');
    console.log('Please run: git init');
    process.exit(1);
  }

  // Check if remote exists
  try {
    execSync('git remote get-url origin', { stdio: 'pipe' });
  } catch (error) {
    console.log('⚠️  No remote origin found. Run scripts/ensure-remote.mjs to set up remote.');
  }

  // Stage all changes
  console.log('📦 Staging all changes...');
  execSync('git add -A', { stdio: 'inherit' });

  // Check if there are changes to commit
  try {
    const status = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    if (!status.trim()) {
      console.log('ℹ️  No changes to commit');
      process.exit(0);
    }
  } catch (error) {
    console.log('ℹ️  No changes to commit');
    process.exit(0);
  }

  // Commit changes
  console.log(`💾 Committing: "${commitMessage}"`);
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push to remote
  console.log('🚀 Pushing to remote...');
  try {
    execSync('git push origin HEAD', { stdio: 'inherit' });
    console.log('✅ Successfully committed and pushed!');
  } catch (error) {
    console.log('⚠️  Commit successful, but push failed. You may need to set up remote or check permissions.');
    console.log('Run: git remote add origin <your-repo-url>');
  }

} catch (error) {
  console.error('❌ Auto-commit failed:', error.message);
  process.exit(1);
}
