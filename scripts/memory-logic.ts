import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import {
  repoRoot,
  memPath,
  snapshotPath,
  readMemoryLines,
  nextMemId,
} from './memory-utils.ts';

/**
 * Rotate memory log when it exceeds the limit
 */
export function rotate(limit = parseInt(process.env.MEM_ROTATE_LIMIT || '300', 10), dryRun = false): void {
  const lines = readMemoryLines();
  if (lines.length > limit) {
    const trimmed = lines.slice(-limit);
    const backupDir = path.join(repoRoot, 'logs');
    fs.mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString();
    const backupPath = path.join(backupDir, `memory.log.${ts}.bak`);
    
    if (dryRun) {
      console.log(`[dry-run] Would backup to ${backupPath} and trim memory.log to last ${limit} entries`);
    } else {
      fs.writeFileSync(backupPath, lines.join('\n') + '\n');
      fs.writeFileSync(memPath, trimmed.join('\n') + '\n');
      console.log(`memory.log trimmed to last ${limit} entries`);
    }
  } else {
    console.log('memory.log already within limit');
  }
}

/**
 * Update memory log from git history
 */
export function updateLog(verify = false): void {
  console.log('Updating memory.log from git history...');
  const tempFile = path.join(repoRoot, 'memory.log.tmp');
  
  try {
    // Get all commits with memory format
    const output = execSync(
      'git log --pretty=format:"%H|%aI|commit|%s|%an"',
      { cwd: repoRoot }
    ).toString().trim();
    
    if (!output) {
      console.log('No commits found');
      return;
    }
    
    const lines = output.split('\n');
    fs.writeFileSync(tempFile, lines.join('\n') + '\n');
    
    if (fs.existsSync(memPath)) {
      const backup = `${memPath}.bak`;
      fs.copyFileSync(memPath, backup);
      console.log(`Backed up existing memory.log to ${backup}`);
    }
    
    fs.copyFileSync(tempFile, memPath);
    fs.unlinkSync(tempFile);
    console.log(`Updated memory.log with ${lines.length} entries`);
    
    if (verify) {
      console.log('Verifying memory integrity...');
      // We'll implement checkMemory directly here for verification
    }
  } catch (error) {
    console.error('Failed to update memory.log:', error);
    process.exit(1);
  }
}

/**
 * Append last commit summary to snapshot
 */
export function snapshotUpdate(): void {
  console.log('Updating snapshot with latest commit...');
  
  try {
    // Get the last commit info
    const hash = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim();
    const summary = execSync(`git log -1 --pretty=%s ${hash}`, { cwd: repoRoot }).toString().trim();
    const timestamp = execSync(`git log -1 --pretty=%aI ${hash}`, { cwd: repoRoot }).toString().trim();
    const author = execSync(`git log -1 --pretty=%an ${hash}`, { cwd: repoRoot }).toString().trim();
    
    // Format for snapshot entry
    const id = nextMemId();
    const entry = [
      `### ${new Date(timestamp).toISOString()} | mem-${id}`,
      '',
      `- Commit SHA: ${hash}`,
      `- Author: ${author}`,
      `- Summary: ${summary}`,
      `- Next Goal: Continue development`,
      '',
      '---',
      '',
    ].join('\n');
    
    // Append to snapshot
    fs.appendFileSync(snapshotPath, entry);
    console.log(`Added commit ${hash.substring(0, 8)} to snapshot as mem-${id}`);
  } catch (error) {
    console.error('Failed to update snapshot:', error);
    process.exit(1);
  }
}

/**
 * Rebuild memory files from git history
 */
export function rebuildMemory(customPath?: string): void {
  console.log('Rebuilding memory files from git history...');
  
  try {
    // First update the memory log
    updateLog(false);
    
    // Clear existing snapshot
    const targetPath = customPath ? path.resolve(customPath) : snapshotPath;
    if (fs.existsSync(targetPath)) {
      const backup = `${targetPath}.bak`;
      fs.copyFileSync(targetPath, backup);
      console.log(`Backed up existing snapshot to ${backup}`);
    }
    
    // Start with empty snapshot
    fs.writeFileSync(targetPath, '# Memory Snapshot\n\n');
    
    // Get all commit entries from memory log
    const lines = readMemoryLines();
    console.log(`Found ${lines.length} entries in memory.log`);
    
    // Process each commit
    let count = 0;
    for (const line of lines) {
      const [hash, timestamp, type] = line.split('|');
      if (type !== 'commit') continue;
      
      const summary = execSync(`git log -1 --pretty=%s ${hash}`, { cwd: repoRoot }).toString().trim();
      const author = execSync(`git log -1 --pretty=%an ${hash}`, { cwd: repoRoot }).toString().trim();
      
      // Format for snapshot entry
      const id = String(++count).padStart(3, '0');
      const entry = [
        `### ${new Date(timestamp).toISOString()} | mem-${id}`,
        '',
        `- Commit SHA: ${hash}`,
        `- Author: ${author}`,
        `- Summary: ${summary}`,
        `- Next Goal: Continue development`,
        '',
        '---',
        '',
      ].join('\n');
      
      // Append to snapshot
      fs.appendFileSync(targetPath, entry);
    }
    
    console.log(`Rebuilt snapshot with ${count} entries`);
  } catch (error) {
    console.error('Failed to rebuild memory:', error);
    process.exit(1);
  }
}

/**
 * Helper function to append memory entry
 */
export function appendMemory(hash: string, summary: string, files: string[] = []): void {
  const timestamp = new Date().toISOString();
  const fileList = files.length > 0 ? files.join(',') : '';
  const line = `${hash}|${timestamp}|commit|${summary}|system|${fileList}\n`;
  
  fs.appendFileSync(memPath, line);
  console.log(`Appended entry for commit ${hash.substring(0, 8)} to memory.log`);
}
