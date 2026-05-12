# Template Build, Test & Release Tooling Plan

## Goal

Move `conviva-dpi-js-sdk-gtm/` from a hand-edited single-file template into a build-tested-released pipeline. Today `template.tpl` is the source: every change is a manual edit, the metadata SHA bump is a manual ritual, there are no automated tests, and there is no local debugging story. This plan introduces 18 incremental improvements grouped by priority.

Each item is implemented and merged independently. The user reviews and confirms each before any code is written.

## Foundation (prerequisite for many items)

Several items below assume a build pipeline exists — i.e., `template.tpl` is *generated* from editable source files in `libs/` via an EJS scaffold, with a `scripts/build-template.js` driver. Setting this up is a one-time foundation:

```
libs/template-info.json        ┐
libs/template-parameters.json  ├─► EJS render ─► template.tpl
libs/sandboxed-js.js           ┘   (template.tpl.ejs)
```

Items that depend on the foundation are tagged **[needs foundation]** below. Items without that tag can proceed standalone.

Whether to do the foundation as a single upfront step or roll it into the first dependent item (#2) will be decided when we reach that item.

Package manager (npm vs pnpm) is also chosen at foundation time. The plan below uses generic `npm run <script>` phrasing — substitute as decided.

---

## Priority order

### Top priority

#### 1. Automate the SHA-update release  *(standalone)*
**Problem:** After each template change, a human runs `git rev-parse HEAD`, edits `metadata.yaml` to prepend a new `versions:` entry with the SHA + change notes, commits, pushes. Easy to forget, easy to typo.
**Change:** Add `.github/workflows/release.yml` triggered by `workflow_dispatch` with a `releaseDescription` input. The job: computes the latest commit SHA, prepends a new `versions:` entry to `metadata.yaml`, lints the YAML, creates a GitHub Release, and pushes the metadata commit.
**Files added:** `.github/workflows/release.yml`

#### 2. Pre-commit guard: build then assert clean tree  *(needs foundation)*
**Problem:** Once `template.tpl` is generated from `libs/`, the two can drift (commit `libs/` change, forget to rebuild). Reviewers see only the unrelated `libs/` diff and miss it.
**Change:** Add a husky pre-commit hook that runs the build then `git diff --quiet`. If the build produced unstaged changes, the commit is blocked.
**Files added:** `.husky/pre-commit`, husky devDep in `package.json`

#### 3. Generate TS types from template parameters  *(needs foundation)*
**Problem:** Schema changes (renaming a Field, changing a Field type) silently break the sandboxed JS that reads them.
**Change:** Add `scripts/generate-types.js` that reads `libs/template-parameters.json` and writes `src/generated-types.ts` mapping GTM Field types to TS types (`CHECKBOX → boolean`, `SELECT → 'a' | 'b'`, `valueValidators: NON_EMPTY → required`). Sandboxed JS is typed against this in tests; renaming a Field breaks the build.
**Files added:** `scripts/generate-types.js`, `src/generated-types.ts`

#### 4. Local dev harness with GTM API polyfills  *(needs foundation)*
**Problem:** The only way to debug sandboxed JS today is via the GTM dashboard's Preview mode — a slow, opaque round-trip.
**Change:** Add Vite-served `index.html` that loads `libs/sandboxed-js.js` after a polyfill shim. The shim overrides `require()` to return TS implementations of GTM APIs (`copyFromWindow`, `injectScript`, `getType`, `JSON`, `logToConsole`, `makeNumber`, `makeString`, `makeTableMap`, `Object`). `npm run dev` starts the harness; the same JS that ships in GTM runs in Chrome devtools.
**Files added:** `index.html`, `src/gtm-polyfill.ts`, `src/gtm-polyfills/*.ts`, `vite.config.ts`

#### 5. Playwright smoke E2E in CI  *(standalone)*
**Problem:** Bugs that don't fail unit tests (CDN URL typos, browser-API issues, integration regressions) only surface after publishing.
**Change:** Add Playwright config + one smoke spec that loads the dev harness, watches `pageerror`, and asserts a network request to the Conviva ingest endpoint. Runs in CI in the official Playwright container against both Chromium and WebKit.
**Files added:** `playwright.config.ts`, `e2e/smoke-test.spec.ts`, `.github/workflows/e2e.yml`

#### 6. Coverage threshold + build-check CI gate  *(needs foundation)*
**Problem:** Without enforced coverage, the test layer can silently degrade. Without a build check, PRs can land with stale `template.tpl`.
**Change:** Add `.github/workflows/build.yml` that installs deps, runs the build, then `git diff --quiet` (rejects PRs where `template.tpl` wasn't rebuilt). Then runs lint + unit tests with a coverage threshold (`100% statements / functions / lines, 83% branches` measured over `libs/**` only).
**Files added:** `.github/workflows/build.yml`
**Files modified:** `jest.config.js` (coverage thresholds)

### Highest-leverage additions

#### 7. GTM-native `___TESTS___` scenarios  *(standalone, easier with foundation)*
**Problem:** Jest unit tests don't exercise the GTM sandbox itself. APIs that are mocked in Jest may behave differently in GTM's actual runtime.
**Change:** Author a `___TESTS___` block inside `template.tpl` (or `template.tpl.ejs` if foundation is in place) using GTM's declarative `scenarios:` syntax with `mock()`, `runCode()`, `assertApi()`, `assertThat()`. Covers each tag type's success and error paths. GTM runs these inside its real sandbox on every "Save" in the dashboard.
**Files modified:** `template.tpl` (or `template.tpl.ejs`)

#### 8. Bidirectional `sync` round-trip  *(needs foundation)*
**Problem:** Editing Fields/Info JSON by hand is painful. The GTM dashboard UI is the natural editor for the schema.
**Change:** Add `scripts/sync-template.js` — paste the GTM-exported `.tpl` over `template.tpl`, run `npm run sync`, and the script splits it back into `libs/template-info.json`, `libs/template-parameters.json`, `libs/sandboxed-js.js`. Refuses to run if `libs/` has uncommitted changes (prevents data loss).
**Files added:** `scripts/sync-template.js`

### Remaining items

#### 9. Test export hatch (`exports:start` / `exports:end`)  *(needs foundation)*
**Problem:** Internal sandbox functions can't be unit-tested without exposing them, but exposing them pollutes the production bundle.
**Change:** Wrap a test-only `__EXPORTS__` block in `// exports:start` / `// exports:end` markers in `libs/sandboxed-js.js`. The build script strips this block when rendering `template.tpl`. Unit tests import `libs/sandboxed-js.js` directly and exercise internals via `win.__EXPORTS__.fnName()`.
**Files modified:** `libs/sandboxed-js.js`, `scripts/build-template.js`

#### 10. Pin SDK CDN version to a single constant  *(needs foundation)*
**Problem:** SDK URL hardcoded inline in sandboxed JS makes upgrades a search-and-replace.
**Change:** Hoist the SDK CDN version to a single `const SDK_VERSION = '...'` near the top of `libs/sandboxed-js.js`. URL is built from the constant. SDK upgrades become one-line edits.
**Files modified:** `libs/sandboxed-js.js`

#### 11. Per-version `.tpl` archive in GitHub Releases  *(extends #1)*
**Problem:** No way to roll back to or audit a previously-shipped template.
**Change:** Extend the release workflow (#1) to copy `template.tpl → conviva-gtm.<short-sha>.tpl` and attach it as a Release asset alongside the change notes.
**Files modified:** `.github/workflows/release.yml`

#### 12. `yaml-lint metadata.yaml` CI step  *(standalone)*
**Problem:** A malformed `metadata.yaml` silently breaks the GTM Gallery submission.
**Change:** Add a yaml-lint step to the build CI workflow (#6) that validates `metadata.yaml` syntax on every PR.
**Files modified:** `.github/workflows/build.yml`

#### 13. Supply-chain hardening for npm/pnpm  *(needs foundation)*
**Problem:** Newly-published npm packages are a known supply-chain attack vector. Postinstall scripts can run arbitrary code.
**Change:** Configure a minimum release age (refuse deps less than 3 days old) and a `built-dependencies` allowlist so only known-safe packages can run postinstall scripts.
**Files added/modified:** `pnpm-workspace.yaml` or `.npmrc` (depending on PM choice at foundation)

#### 14. Bot committer for release commits  *(extends #1)*
**Problem:** Hard to filter automation commits from human commits in `git log`.
**Change:** In the release workflow (#1), set the commit author to a bot identity (e.g., `conviva-gtm-bot <bot@conviva.com>`).
**Files modified:** `.github/workflows/release.yml`

#### 15. Snapshot tests for assembled config shape  *(needs foundation)*
**Problem:** Field schema changes are hard to spot in PR review when buried in JSON.
**Change:** Add Jest tests that `toMatchSnapshot()` on the rendered `template-parameters.json` shape. Schema changes show up as snapshot diffs.
**Files added:** `tests/template-parameters.snapshot.test.ts`, snapshot file

#### 16. `kitchen-sink` mock data object  *(needs foundation)*
**Problem:** Each unit test re-builds its own mock GTM `data` object. Adding a Field means updating dozens of mocks.
**Change:** Add `tests/kitchen-sink.ts` — one mock object covering every Field with realistic values. Shared by unit tests AND the dev harness (#4). Single place to update when adding a Field.
**Files added:** `tests/kitchen-sink.ts`

#### 17. Per-directory ESLint overrides  *(needs foundation)*
**Problem:** Polyfill code legitimately needs `any` and references to undefined globals; tests need to allow many things production code shouldn't. Globally lax rules hide real issues.
**Change:** Add `.eslintrc.js` with strict rules for `src/`, relaxed for `src/gtm-polyfills/` and `tests/`.
**Files added:** `.eslintrc.js`, `.eslintignore`

#### 18. GitHub-issue → Jira mirror workflow  *(standalone)*
**Problem:** Issues raised on the GitHub repo aren't visible to the Jira-using product team.
**Change:** Add `.github/workflows/jira-issue-creator.yml` that mirrors new GitHub issues into a designated Jira project on `conviva.atlassian.net`.
**Files added:** `.github/workflows/jira-issue-creator.yml`

---

## Execution model

For each item, in order:

1. Brief discussion of approach + open questions.
2. User confirms.
3. Implement, test, commit on this branch (`chore/template-build-and-release-tooling`).
4. Move to next item.

Items 1, 5, 12, 18 can be implemented in any order without the foundation. The foundation block is implicitly the prerequisite for the first **[needs foundation]** item we reach — that's where we'll decide whether to do the foundation as a single upfront step or roll it into the first dependent item.
