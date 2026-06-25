#!/usr/bin/env node
/**
 * TOOLING_PLAN.md item #22 — fail if any workflow uses: actions/foo@v4 (tag only).
 */

const fs = require('node:fs');
const path = require('node:path');

const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');
const USES_RE = /^\s*uses:\s+(.+)$/gm;
const BAD_RE = /@v\d+/;

let failed = false;

for (const file of fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))) {
  const content = fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8');
  let match;
  while ((match = USES_RE.exec(content)) !== null) {
    const ref = match[1].trim();
    if (BAD_RE.test(ref)) {
      console.error(`${file}: unpinned action reference: ${ref}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('All workflow uses: references are SHA-pinned.');
