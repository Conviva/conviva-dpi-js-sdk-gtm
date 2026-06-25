/**
 * Jest configuration.
 *
 * - jsdom test environment so polyfills that touch `window` work.
 * - ts-jest transforms TypeScript specs (tests/) and the polyfills (src/).
 * - babel-jest transforms libs/sandboxed-js.js so it can be loaded directly
 *   from a spec — the file is GTM-flavoured ES5/ES6 with no module wrapper.
 * - moduleNameMapper hijacks bare `require('copyFromWindow')` calls coming
 *   out of libs/sandboxed-js.js so they resolve to our TypeScript polyfills.
 *   Keep this list in sync with src/gtm-polyfill.ts (11 entries).
 *
 * Coverage thresholds are intentionally slack here. TOOLING_PLAN.md item #6
 * tightens them to 100/83/100/100 over libs/** once the test suite is built
 * out — enforcing them today would block the foundation PR.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Watchman has no role in CI and adds a dev-machine dependency we don't
  // want to require contributors to install. Native Node fs is fine for
  // a project this size.
  watchman: false,
  testMatch: ['<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^copyFromWindow$': '<rootDir>/src/gtm-polyfills/copy-from-window.ts',
    '^getType$':       '<rootDir>/src/gtm-polyfills/get-type.ts',
    '^injectScript$':  '<rootDir>/tests/__mocks__/inject-script.js',
    '^createQueue$':   '<rootDir>/src/gtm-polyfills/create-queue.ts',
    '^setInWindow$':   '<rootDir>/src/gtm-polyfills/set-in-window.ts',
    '^callInWindow$':  '<rootDir>/src/gtm-polyfills/call-in-window.ts',
    '^logToConsole$':  '<rootDir>/src/gtm-polyfills/log-to-console.ts',
    '^makeNumber$':    '<rootDir>/src/gtm-polyfills/make-number.ts',
    '^makeString$':    '<rootDir>/src/gtm-polyfills/make-string.ts',
    '^makeTableMap$':  '<rootDir>/src/gtm-polyfills/make-table-map.ts',
    '^Object$':        '<rootDir>/src/gtm-polyfills/object.ts',
    '^@/(.*)$':        '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: ['libs/sandboxed-js.js'],
  coverageThreshold: {
    global: { statements: 97, branches: 83, functions: 100, lines: 99 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  globals: {
    'ts-jest': { useESM: true },
  },
};
