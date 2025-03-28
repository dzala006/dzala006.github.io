/**
 * Development Script for Personalized Adventure App
 * 
 * This script starts both the backend and frontend development servers simultaneously.
 * It requires concurrently to be installed: npm install -g concurrently
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if directories exist
const backendDir = path.join(__dirname, 'personalized-adventure-backend');
const frontendDir = path.join(__dirname, 'PersonalizedAdventureApp');

if (!fs.existsSync(backendDir)) {
  console.error(`Backend directory not found: ${backendDir}`);
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error(`Frontend directory not found: ${frontendDir}`);
  process.exit(1);
}

// Function to start a process
const startProcess = (name, command, args, cwd) => {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: true }
  });
  
  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });
  
  return proc;
};

// Start backend
const backend = startProcess(
  'Backend',
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  backendDir
);

// Start frontend
const frontend = startProcess(
  'Frontend',
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['start'],
  frontendDir
);

// Handle process termination
const cleanup = () => {
  console.log('Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.log('\nDevelopment servers started! Press Ctrl+C to stop.\n');