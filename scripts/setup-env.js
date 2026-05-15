#!/usr/bin/env node
/**
 * Bootstraps a local .env for the dev harness.
 *
 * If .env doesn't exist, copies .env.example and replaces $CUSTOMER_KEY with
 * a placeholder so `pnpm dev` starts without crashing on missing env. Real
 * keys go in .env (gitignored) before any meaningful test against Touchstone.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');

function setupEnv() {
  if (fs.existsSync(ENV_PATH)) {
    console.log('✓ .env exists; leaving as-is');
    return;
  }
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    console.log('⚠ no .env.example found; skipping');
    return;
  }
  const content = fs
    .readFileSync(ENV_EXAMPLE_PATH, 'utf8')
    .replace(/\$CUSTOMER_KEY/g, '<set VITE_CONVIVA_CUSTOMER_KEY here>');
  fs.writeFileSync(ENV_PATH, content);
  console.log('✓ wrote .env (placeholder customer key) — edit before running real tests');
}

if (require.main === module) {
  setupEnv();
}

module.exports = setupEnv;
