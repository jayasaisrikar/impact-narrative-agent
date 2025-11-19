#!/usr/bin/env node
/**
 * Dotenv Loader for Deno Agent
 * This script loads environment variables from .env file and passes them to Deno
 */

import 'dotenv/config.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get all environment variables
const env = { ...process.env };

// Start Deno process with environment variables
const deno = spawn('deno', [
  'run',
  '--allow-env',
  '--allow-net',
  '--allow-read',
  'deno-agent/main.ts'
], {
  env,
  stdio: 'inherit',
  cwd: __dirname
});

deno.on('error', (error) => {
  console.error('Failed to start Deno:', error);
  process.exit(1);
});

deno.on('exit', (code) => {
  process.exit(code || 0);
});
