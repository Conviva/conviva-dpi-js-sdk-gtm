// Bootstraps the dev harness. Overrides require() so that libs/sandboxed-js.js
// (which only knows the GTM `require('<api>')` shape) resolves to our local
// TypeScript polyfills under src/gtm-polyfills/.
//
// Loaded by index.html BEFORE libs/sandboxed-js.js. Also referenced by
// jest.config.js's moduleNameMapper so the same polyfills are used in unit tests.

import copyFromWindow from './gtm-polyfills/copy-from-window';
import getType from './gtm-polyfills/get-type';
import injectScript from './gtm-polyfills/inject-script';
import createQueue from './gtm-polyfills/create-queue';
import setInWindow from './gtm-polyfills/set-in-window';
import callInWindow from './gtm-polyfills/call-in-window';
import logToConsole from './gtm-polyfills/log-to-console';
import makeNumber from './gtm-polyfills/make-number';
import makeString from './gtm-polyfills/make-string';
import makeTableMap from './gtm-polyfills/make-table-map';
import GtmObject from './gtm-polyfills/object';

function require(module: string): any {
  switch (module) {
    case 'copyFromWindow':
      return copyFromWindow;
    case 'getType':
      return getType;
    case 'injectScript':
      return injectScript;
    case 'createQueue':
      return createQueue;
    case 'setInWindow':
      return setInWindow;
    case 'callInWindow':
      return callInWindow;
    case 'logToConsole':
      return logToConsole;
    case 'makeNumber':
      return makeNumber;
    case 'makeString':
      return makeString;
    case 'makeTableMap':
      return makeTableMap;
    case 'Object':
      return GtmObject;
    default:
      throw new Error(
        `Unknown GTM module: ${module}. Add a polyfill at src/gtm-polyfills/${module}.ts ` +
          'and register it in src/gtm-polyfill.ts and jest.config.js.',
      );
  }
}

const win: any = typeof globalThis !== 'undefined' ? globalThis : window;
win.require = require;
