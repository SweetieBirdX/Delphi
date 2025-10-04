#!/usr/bin/env node

import { execSync } from 'child_process';

/**
 * Ensure remote origin is set up
 * Usage: node scripts/ensure-remote.mjs
 */

try {
  // Check if remote origin exists
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    console.log('✅ Remote origin is configured:', remoteUrl);
  } catch (error) {
    console.log('❌ No remote origin found');
    console.log('');
    console.log('To set up a remote repository:');
    console.log('1. Create a repository on GitHub/GitLab/etc.');
    console.log('2. Run: git remote add origin <your-repo-url>');
    console.log('3. Run: git push -u origin main');
    console.log('');
    console.log('Example:');
    console.log('git remote add origin https://github.com/username/delphi-nft-ticketing.git');
    console.log('git push -u origin main');
  }
} catch (error) {
  console.error('❌ Error checking remote:', error.message);
  process.exit(1);
}
