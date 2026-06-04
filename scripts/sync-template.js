#!/usr/bin/env node
/**
 * Round-trip: split template.tpl → libs/ (TOOLING_PLAN.md item #8).
 *
 * Workflow:
 *   1. Paste a GTM-exported .tpl over template.tpl (or edit template.tpl in place).
 *   2. Run `pnpm sync`.
 *
 * Refuses to run when libs/ has uncommitted changes (prevents overwriting local edits).
 * Preserves // exports:start … // exports:end from the existing libs/sandboxed-js.js
 * because the published template never contains that hatch (stripped at build time).
 */

const fs = require('node:fs');
const { execSync } = require('node:child_process');

const ROOT = process.cwd();
const LIBS = 'libs';
const TEMPLATE = 'template.tpl';

function trimEmptyLines(content) {
  const lines = content.split('\n');
  let start = 0;
  while (start < lines.length && lines[start].trim() === '') {
    start++;
  }
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === '') {
    end--;
  }
  return lines.slice(start, end + 1).join('\n');
}

function checkUncommittedLibs() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore', cwd: ROOT });
  } catch {
    console.log('Note: not a git repo — skipping uncommitted libs/ guard');
    return;
  }

  const gitStatus = execSync(`git status --porcelain ${LIBS}/`, {
    encoding: 'utf8',
    cwd: ROOT,
  }).trim();

  if (gitStatus) {
    console.error(`❌ Cannot sync ${TEMPLATE} while libs/ has uncommitted changes:\n`);
    console.error(gitStatus);
    console.error('\nCommit or stash libs/ changes before syncing.');
    process.exit(1);
  }

  console.log(`✓ No uncommitted changes in ${LIBS}/`);
}

function readExportsSection() {
  const path = `${LIBS}/sandboxed-js.js`;
  if (!fs.existsSync(path)) {
    return '';
  }

  const current = fs.readFileSync(path, 'utf8');
  const START = '// exports:start';
  const END = '// exports:end';
  const a = current.indexOf(START);
  const b = current.indexOf(END);

  if (a !== -1 && b !== -1 && b > a) {
    console.log('✓ Will preserve existing exports hatch');
    return current.substring(a, b + END.length);
  }

  return '';
}

function extractBetween(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return trimEmptyLines(content.substring(start + startMarker.length, end));
}

function main() {
  console.log(`Extracting ${LIBS}/ from ${TEMPLATE}...`);
  checkUncommittedLibs();

  const exportsSection = readExportsSection();

  let templateContent;
  try {
    templateContent = fs.readFileSync(TEMPLATE, 'utf8');
  } catch (err) {
    console.error(`Error reading ${TEMPLATE}:`, err.message);
    process.exit(1);
  }

  const infoContent = extractBetween(templateContent, '___INFO___', '___TEMPLATE_PARAMETERS___');
  const templateParamsContent = extractBetween(
    templateContent,
    '___TEMPLATE_PARAMETERS___',
    '___SANDBOXED_JS_FOR_WEB_TEMPLATE___',
  );
  const sandboxedJsContent = extractBetween(
    templateContent,
    '___SANDBOXED_JS_FOR_WEB_TEMPLATE___',
    '___WEB_PERMISSIONS___',
  );

  if (!infoContent || !templateParamsContent || !sandboxedJsContent) {
    console.error(`Could not find required GTM sections in ${TEMPLATE}`);
    process.exit(1);
  }

  if (!fs.existsSync(LIBS)) {
    fs.mkdirSync(LIBS);
    console.log(`Created ${LIBS}/ directory`);
  }

  fs.writeFileSync(`${LIBS}/template-info.json`, infoContent + '\n');
  console.log('✓ Wrote libs/template-info.json');

  fs.writeFileSync(`${LIBS}/template-parameters.json`, templateParamsContent + '\n');
  console.log('✓ Wrote libs/template-parameters.json');

  let finalSandboxedJs = sandboxedJsContent;
  if (exportsSection) {
    finalSandboxedJs += '\n\n' + exportsSection;
    console.log('✓ Restored exports hatch in libs/sandboxed-js.js');
  }

  fs.writeFileSync(`${LIBS}/sandboxed-js.js`, finalSandboxedJs + '\n');
  console.log('✓ Wrote libs/sandboxed-js.js');
  console.log('\nDone. Run `pnpm build` to regenerate template.tpl from libs/.');
}

if (require.main === module) {
  main();
}
