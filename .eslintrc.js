/**
 * ESLint config (TOOLING_PLAN.md item #17).
 *
 * Strict by default for src/. Relaxed for two carve-outs:
 *   - src/gtm-polyfill.ts and src/gtm-polyfills/** : `any` is acceptable
 *     because we're shimming an untyped sandbox API; require()/module are
 *     legitimately defined at runtime by the harness; window references
 *     are first-class.
 *   - tests/**                                      : `any` and console
 *     are fine in spec setup; tests aren't shipped.
 *
 * `pnpm lint` runs only over `src --ext .ts`, so this config covers src/
 * primarily; the test override is a forward-compatibility hedge for when
 * we expand `lint` to cover tests/ too.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // General
    'no-console': 'off',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    // Style
    'indent': 'off',
    '@typescript-eslint/indent': ['error', 2],
    'quotes': 'off',
    '@typescript-eslint/quotes': ['error', 'single'],
    'semi': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    // Best practices.
    // `eqeqeq` allows `== null` / `!= null` (standard idiom for "null OR undefined").
    // `curly` allows brace-less single-line if/else (so `if (foo) return;` is OK).
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['error', 'multi-line'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['src/gtm-polyfill.ts', 'src/gtm-polyfills/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-undef': 'off',
      },
      globals: {
        window: 'readonly',
        globalThis: 'readonly',
        module: 'writable',
        require: 'writable',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'libs/',
    '*.js',
    '!.eslintrc.js',
    'src/generated-types.ts',
  ],
};
