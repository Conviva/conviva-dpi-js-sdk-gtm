#!/usr/bin/env node
/**
 * Reads libs/template-parameters.json and writes src/generated-types.ts:
 * a TypeScript `interface GeneratedGtmParameters` describing the GTM
 * `data` object passed to sandboxed JS at runtime. Used by the dev harness,
 * the kitchen-sink mock, and unit tests so renaming a Field is a TypeScript
 * error rather than a silent runtime break.
 *
 * GTM Field-type → TypeScript-type mapping:
 *
 *   CHECKBOX      → boolean
 *   TEXT          → string
 *   SELECT        → union of selectItems[].value (or Record<string,string>)
 *   SIMPLE_TABLE  → Array<{ col: type, ... }>      (from simpleTableColumns)
 *   PARAM_TABLE   → Array<{ col?: type, ... }>     (from paramTableColumns[].param, all optional)
 *   GROUP         → flatten subParams to top-level (the GROUP itself emits nothing)
 *   LABEL         → skipped (not a data field)
 *   anything else → any (escape hatch)
 *
 * Optionality: a field is optional unless its `valueValidators` includes
 * `{ type: 'NON_EMPTY' }`.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PARAMS_PATH = path.join(ROOT, 'libs/template-parameters.json');
const OUT_PATH = path.join(ROOT, 'src/generated-types.ts');

function readParameters() {
  return JSON.parse(fs.readFileSync(PARAMS_PATH, 'utf8'));
}

function mapParameterType(param) {
  switch (param.type) {
    case 'CHECKBOX':
      return 'boolean';
    case 'TEXT':
      return 'string';
    case 'SELECT':
      if (param.selectItems && param.selectItems.length > 0) {
        return param.selectItems.map((item) => `'${item.value}'`).join(' | ');
      }
      return 'Record<string, string>';
    case 'SIMPLE_TABLE':
      if (param.simpleTableColumns) {
        const cols = param.simpleTableColumns
          .map((col) => `${col.name}: ${mapParameterType(col)}`)
          .join('; ');
        return `Array<{${cols}}>`;
      }
      return 'Array<{[key: string]: any}>';
    case 'PARAM_TABLE':
      if (param.paramTableColumns) {
        const cols = param.paramTableColumns
          .map((col) => `${col.param.name}?: ${mapParameterType(col.param)}`)
          .join('; ');
        return `Array<{${cols}}>`;
      }
      return 'Array<{[key: string]: any}>';
    case 'GROUP':
      return null; // flattened by caller
    case 'LABEL':
      return null; // not a data field
    default:
      return 'any';
  }
}

function isOptional(param) {
  if (param.valueValidators) {
    return !param.valueValidators.some((v) => v.type === 'NON_EMPTY');
  }
  return true;
}

function processParameter(param, lines, processedNames) {
  if (param.type === 'LABEL') return;
  if (param.type === 'GROUP') {
    if (param.subParams) {
      for (const sub of param.subParams) processParameter(sub, lines, processedNames);
    }
    return;
  }
  const tsType = mapParameterType(param);
  if (tsType === null) return;
  if (!processedNames.has(param.name)) {
    const optional = isOptional(param) ? '?' : '';
    lines.push(`  ${param.name}${optional}: ${tsType};`);
    processedNames.add(param.name);
  }
  if (param.subParams) {
    for (const sub of param.subParams) processParameter(sub, lines, processedNames);
  }
}

function generateInterface(parameters) {
  const lines = ['export interface GeneratedGtmParameters {'];
  const processedNames = new Set();
  for (const p of parameters) processParameter(p, lines, processedNames);
  lines.push('}');
  return lines.join('\n');
}

function main() {
  const parameters = readParameters();
  const tsInterface = generateInterface(parameters);
  const header = `// This file is auto-generated from libs/template-parameters.json.
// Do not edit manually — run \`pnpm build\` to regenerate.

`;
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, header + tsInterface + '\n');
  console.log(`Wrote ${path.relative(ROOT, OUT_PATH)} (${parameters.length} top-level parameters)`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Error generating types:', err.message);
    process.exit(1);
  }
}

module.exports = { mapParameterType, generateInterface };
