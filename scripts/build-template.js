#!/usr/bin/env node
/**
 * Renders template.tpl from template.tpl.ejs + libs/.
 *
 * Sources of truth:
 *   libs/template-info.json
 *   libs/template-parameters.json
 *   libs/sandboxed-js.js
 *
 * Output:
 *   template.tpl                 (committed; CI rejects PRs where this is stale)
 *
 * Sandboxed JS may carry an internal export hatch wrapped in
 *   // exports:start ... // exports:end
 * markers (TOOLING_PLAN.md item #9). Anything between the markers (and
 * the markers themselves) is stripped before the JS is rendered into
 * template.tpl, so the GTM-published template never contains the hatch.
 */

const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');

const ROOT = path.resolve(__dirname, '..');
const EJS_PATH = path.join(ROOT, 'template.tpl.ejs');
const OUT_PATH = path.join(ROOT, 'template.tpl');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function stripExportsHatch(sandboxedJs) {
  const START = '// exports:start';
  const END = '// exports:end';
  const a = sandboxedJs.indexOf(START);
  const b = sandboxedJs.indexOf(END);
  if (a === -1 && b === -1) {
    return sandboxedJs;
  }
  if (a === -1 || b === -1 || b < a) {
    throw new Error(
      `Malformed exports hatch in libs/sandboxed-js.js — saw "${START}" at ${a}, "${END}" at ${b}`,
    );
  }
  return sandboxedJs.slice(0, a) + sandboxedJs.slice(b + END.length);
}

// libs files are stored with a single trailing newline (POSIX-style).
// That newline IS part of the rendered template — it sits between the
// section content and the blank line(s) before the next marker.
// Stripping it would shift every section boundary by one line.

function loadStrippedSandboxedJs() {
  return stripExportsHatch(read('libs/sandboxed-js.js'));
}

function loadJson(rel) {
  return read(rel);
}

function assertPlaceholder(template, name) {
  if (!template.includes(`<%- ${name} %>`)) {
    throw new Error(`template.tpl.ejs is missing the <%- ${name} %> placeholder`);
  }
}

function main() {
  const template = read(path.relative(ROOT, EJS_PATH));
  ['infoJson', 'templateParametersJson', 'sandboxedJs'].forEach((p) => assertPlaceholder(template, p));

  const data = {
    infoJson: loadJson('libs/template-info.json'),
    templateParametersJson: loadJson('libs/template-parameters.json'),
    sandboxedJs: loadStrippedSandboxedJs(),
  };

  const out = ejs.render(template, data, { filename: EJS_PATH });
  fs.writeFileSync(OUT_PATH, out);
  console.log(`Wrote template.tpl (${out.length} bytes)`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Error building template:', err.message);
    process.exit(1);
  }
}

module.exports = { stripExportsHatch };
