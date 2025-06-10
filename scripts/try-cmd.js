#!/usr/bin/env node
const { spawn } = require('child_process');
const cmd = process.argv.slice(2);
if (!cmd.length) process.exit(0);
const child = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' });
child.on('error', () => {
  console.log(`Command ${cmd[0]} missing, skipping.`);
  process.exit(0);
});
child.on('exit', code => process.exit(code));
