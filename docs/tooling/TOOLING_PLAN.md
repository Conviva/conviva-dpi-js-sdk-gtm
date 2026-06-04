# Template Build, Test & Release Tooling Plan

## Goal

Move `conviva-dpi-js-sdk-gtm/` from a hand-edited single-file template into a build-tested-released pipeline. Today `template.tpl` is the source: every change is a manual edit, the metadata SHA bump is a manual ritual, there are no automated tests, and there is no local debugging story. This plan introduces 22 incremental improvements grouped by priority.

The plan is calibrated against [`amplitude/amplitude-browser-sdk-gtm-template`](https://github.com/amplitude/amplitude-browser-sdk-gtm-template) — a public reference repo that has already shipped this whole pipeline. References below are to file paths in that repo.

Each item is implemented incrementally; the user reviews and confirms each before any code is written. **PRs target `develop`; nothing merges to `main` until the full plan is complete and verified on `develop`** (see [Branching model](#branching-model) and [Delivery to `main`](#delivery-to-main)).

## Branching model

**Policy (locked in):** `develop` is the integration branch. Topic work lands there via PR. When the plan is done and the verification checklist is green, merge **`develop` → `main`** once.

```
main          ← production / gallery releases (hand-edited template until final merge)
  ↑
develop       ← integration: all tooling PRs merge here
  ↑
topic branches (e.g. chore/release-tooling-foundation, chore/playwright-e2e)
```

| Branch | Role | Current state (repo) |
|---|---|---|
| `main` | Stable; release workflow (#1) not here yet | Same tip as `develop` today (`a280c59`) |
| `develop` | Long-lived integration branch for the tooling program | Exists on `origin`; no tooling commits yet |
| `chore/release-tooling` | Item **#1** (release workflow) + tooling plan docs | 4 commits ahead of `develop`; **not merged to `develop` or `main`** |
| `chore/release-tooling-foundation` | Foundation bucket (#2–#4, #13, #17, …) + includes `release-tooling` history | 10 commits ahead of `develop`; active implementation branch |

**PR flow:** Open PRs **into `develop`** (from topic branches or from `chore/release-tooling-foundation` when a bucket is ready). Do not open tooling PRs directly into `main` until the final `develop` → `main` promotion.

**Consolidation (when ready):** Merge `chore/release-tooling-foundation` → `develop` (it already contains the `chore/release-tooling` commits). Alternatively merge `chore/release-tooling` first, then foundation — same result if foundation is based on `release-tooling`.

**Final promotion:** After all 22 items are on `develop` and [verified](#delivery-to-main), one PR: **`develop` → `main`**.

## Foundation (prerequisite for many items)

Several items below assume a build pipeline exists — i.e., `template.tpl` is *generated* from editable source files in `libs/` via an EJS scaffold, with a `scripts/build-template.js` driver:

```
libs/template-info.json        ┐
libs/template-parameters.json  ├─► EJS render ─► template.tpl
libs/sandboxed-js.js           ┘   (template.tpl.ejs)
```

Items that depend on the foundation are tagged **[needs foundation]** below. Items without that tag can proceed standalone.

### Foundation decisions (locked in based on Amplitude reference)

- **Package manager: pnpm.** Amplitude uses `pnpm@10.26.1`; supply-chain item #13 (`minimumReleaseAge`, `onlyBuiltDependencies`, `blockExoticSubdeps`, `trustPolicy`) only exists for pnpm. All scripts below say `pnpm <script>`.
- **Delivery shape: one upfront foundation PR**, not rolled into #2. The pieces below cross-reference each other enough that splitting them across PRs creates awkward intermediate states (e.g., husky hook references `pnpm build` which references the EJS scaffold which references the `libs/` split which references the polyfills used by tests).
- **Working branch: `chore/release-tooling-foundation`** for the foundation bucket (item #1 lives on `chore/release-tooling`, which foundation already includes). Remaining items (#2–#22) continue on topic branches merged into **`develop`** (foundation branch can merge to `develop` when that bucket is ready, or stay on the working branch until the full plan is done — prefer merging incrementally into `develop` only when a slice is verified).

### Foundation deliverables (single PR)

| Bucket | Files |
|---|---|
| Package manager | `package.json` (with `packageManager: "pnpm@..."` + scripts: `build`, `test`, `test:e2e`, `dev`, `sync`, `lint`, `lint:fix`, `type-check`, `setup-env`, `prepare`); `pnpm-workspace.yaml` (item #13 settings); `pnpm-lock.yaml`; `.npmrc` if needed |
| Build pipeline | `template.tpl.ejs` (committed alongside generated `template.tpl`); `libs/template-info.json`, `libs/template-parameters.json`, `libs/sandboxed-js.js` (split out of current `template.tpl`); `scripts/build-template.js` |
| TypeScript | `tsconfig.json` (strict, ES2020, `include: ["src/**/*"]`, `exclude: ["tests"]`) |
| Lint | `.eslintrc.js` (per-dir overrides — see #17); `.eslintignore` |
| Test (Jest) | `jest.config.js` (jsdom, ts-jest, `moduleNameMapper` for polyfills, coverage threshold over `libs/**`); `.babelrc` (`@babel/preset-env` for node, so `babel-jest` can transform `.js` in `libs/`) |
| Dev harness | `index.html`; `src/gtm-polyfill.ts`; `src/gtm-polyfills/{copy-from-window,get-type,inject-script,create-queue,set-in-window,call-in-window,log-to-console,make-number,make-string,make-table-map,object}.ts` (11 polyfills — see #4 for the rationale; differs from Amplitude); `vite.config.ts` (or rely on Vite defaults) |
| Local env | `.env.example`; `scripts/setup-env.js`; `dev` script wires `pnpm setup-env && vite serve`; harness reads `import.meta.env.VITE_<key>` and exposes it on `window` |
| Pre-commit | `.husky/pre-commit` (`pnpm lint && pnpm build && git diff --quiet`); husky devDep |
| `.gitignore` additions | `node_modules/`, `coverage/`, `playwright-report/`, `test-results/`, `.env` |
| Generated, committed | `src/generated-types.ts` (regenerated by `scripts/generate-types.js` on every build, but checked in so the foundation PR has a self-consistent snapshot) |

After the foundation bucket is implemented, the remaining items below proceed on `develop` (via PRs from topic branches), not on `main`.

---

## Priority order

### Top priority

#### 1. Automate the SHA-update release  *(standalone)*
**Problem:** After each template change, a human runs `git rev-parse HEAD`, edits `metadata.yaml` to prepend a new `versions:` entry with the SHA + change notes, commits, pushes. Easy to forget, easy to typo.
**Change:** Add `.github/workflows/update-template-metadata.yml` triggered by `workflow_dispatch` with a `releaseDescription` input. The job: (a) installs deps and runs `pnpm build && pnpm test` so we never publish a broken template (gap vs. PR #6 — currently absent); (b) computes the latest commit SHA; (c) prepends a new `versions:` entry to `metadata.yaml`; (d) lints the YAML (yaml-lint as a release-time guard, mirroring #12); (e) creates a GitHub Release; (f) pushes the metadata commit. Draft-release-on-non-main and idempotency guard included.
**Files added:** `.github/workflows/update-template-metadata.yml`
**Status:** Implemented on branch `chore/release-tooling` *(not on `develop` or `main` yet)*. PR #6 in the plan referred to the intended release PR; workflow is `update-template-metadata.yml` (not `release.yml`). Pre-publish `pnpm build` + `pnpm test` guard added on `chore/release-tooling-foundation` (with #6).

#### 2. Pre-commit guard: lint, build, then assert clean tree  *(needs foundation)*
**Problem:** Once `template.tpl` is generated from `libs/`, the two can drift (commit `libs/` change, forget to rebuild). Reviewers see only the unrelated `libs/` diff and miss it.
**Change:** Add a husky pre-commit hook that runs `pnpm lint && pnpm build && git diff --quiet`. Lint runs first to surface stylistic issues cheaply; build then regenerates `template.tpl` and `src/generated-types.ts`; the `git diff --quiet` check blocks the commit if anything got regenerated. *(Note: this is the foundation's husky hook; if the foundation PR ships it inline, this item is just "verified working".)*
**Files added:** `.husky/pre-commit`, husky devDep in `package.json`
**Status:** Done on `chore/release-tooling-foundation` (`d5a342d`).

#### 3. Generate TS types from template parameters  *(needs foundation)*
**Problem:** Schema changes (renaming a Field, changing a Field type) silently break the sandboxed JS that reads them.
**Change:** Add `scripts/generate-types.js` that reads `libs/template-parameters.json` and writes `src/generated-types.ts` exporting an `interface GeneratedGtmParameters`. GTM Field-type → TS-type mapping:

| GTM type | TS type | Notes |
|---|---|---|
| `CHECKBOX` | `boolean` | |
| `TEXT` | `string` | |
| `SELECT` | `'a' \| 'b' \| ...` | union from `selectItems[].value`; falls back to `Record<string, string>` if no items |
| `SIMPLE_TABLE` | `Array<{col: type, ...}>` | columns from `simpleTableColumns` |
| `PARAM_TABLE` | `Array<{col?: type, ...}>` | columns from `paramTableColumns[].param`, all optional |
| `GROUP` | (flatten subParams to top-level) | the GROUP itself is not emitted |
| `LABEL` | (skipped) | not a data field |
| anything else | `any` | escape hatch |

Optional vs. required: a field is optional unless its `valueValidators` includes `{ type: 'NON_EMPTY' }`. Sandboxed JS is typed against `GeneratedGtmParameters` in unit tests and the kitchen-sink mock (#16); renaming a Field breaks the build.
**Files added:** `scripts/generate-types.js`, `src/generated-types.ts`

#### 4. Local dev harness with GTM API polyfills  *(needs foundation)*
**Problem:** The only way to debug sandboxed JS today is via the GTM dashboard's Preview mode — a slow, opaque round-trip.
**Change:** Add Vite-served `index.html` that loads `libs/sandboxed-js.js` after a polyfill shim. The shim (`src/gtm-polyfill.ts`) overrides `require()` (attached to `globalThis`) to return TS implementations of the **11 GTM APIs Conviva's `sandboxed-js.js` uses**:

`copyFromWindow`, `getType`, `injectScript`, `createQueue`, `setInWindow`, `callInWindow`, `logToConsole`, `makeNumber`, `makeString`, `makeTableMap`, `Object`.

This list differs from Amplitude's reference repo: Conviva does **not** use `JSON`, but **does** use `createQueue`, `setInWindow`, and `callInWindow`. Each polyfill lives in `src/gtm-polyfills/<api>.ts`. `pnpm dev` starts the harness; the same JS that ships in GTM runs in Chrome devtools.

Env wiring: a Conviva customer key (e.g. Touchstone) is read at runtime via `import.meta.env.VITE_CONVIVA_CUSTOMER_KEY` and exposed on `window.CONVIVA_CUSTOMER_KEY`. The kitchen-sink mock (#16) consumes it. `scripts/setup-env.js` (foundation) copies `.env.example` to `.env` if missing so first-time setup is one command.
**Files added:** `index.html`, `src/gtm-polyfill.ts`, `src/gtm-polyfills/*.ts`, `vite.config.ts` *(some/all of these land in the foundation PR)*

#### 5. Playwright smoke E2E in CI  *(standalone — but spec depends on the dev harness from #4 / foundation)*
**Problem:** Bugs that don't fail unit tests (CDN URL typos, browser-API issues, integration regressions) only surface after publishing.
**Change:** Add Playwright config + one smoke spec that loads the dev harness, watches `pageerror`, and asserts a network request to the Conviva ingest endpoint (Touchstone or production — TBD). Runs in CI in the official Playwright container (`mcr.microsoft.com/playwright:v<X>`) against both Chromium and WebKit. The CI job writes `.env` from a GitHub secret before booting the harness.

**Open question (blocks this item):** which Conviva endpoint do we assert on, and which customer key do we use? Options: dedicated test customer key in Touchstone (mirrors Amplitude's model), or a localhost intercept that doesn't talk to a real ingest.
**Files added:** `playwright.config.ts`, `e2e/smoke-test.spec.ts`, `.github/workflows/e2e.yml`
**Secrets needed:** `CONVIVA_CUSTOMER_KEY` (or equivalent) on the GitHub repo.
**Status:** Not started — blocked on ingest endpoint / customer key decision.

#### 6. Coverage threshold + build-check CI gate  *(needs foundation)*
**Problem:** Without enforced coverage, the test layer can silently degrade. Without a build check, PRs can land with stale `template.tpl`.
**Change:** Add `.github/workflows/build.yml` (triggers: PR to `main` + push to `main`) that:

1. `pnpm install`
2. `pnpm build`
3. `git diff --quiet` — rejects PRs where `template.tpl` / `src/generated-types.ts` wasn't rebuilt
4. `npx yaml-lint metadata.yaml` — covers item #12, same workflow
5. `pnpm type-check` — `tsc --noEmit` against `src/`
6. `pnpm lint`
7. `pnpm test` with coverage threshold (`100% statements / functions / lines, 83% branches` measured over `libs/**` only)

This single workflow consolidates #6 + #12 + the type-check gate.
**Files added:** `.github/workflows/build.yml`
**Files modified:** `jest.config.js` (coverage thresholds)
**Status:** CI workflow + release pre-publish guard done on `chore/release-tooling-foundation`; **coverage thresholds still at 0** until #9/#15/#16 expand the test suite (jest.config.js comment).

### Highest-leverage additions

#### 7. GTM-native `___TESTS___` scenarios  *(standalone, easier with foundation)*
**Problem:** Jest unit tests don't exercise the GTM sandbox itself. APIs that are mocked in Jest may behave differently in GTM's actual runtime.
**Change:** Author a `___TESTS___` block inside `template.tpl` (or `template.tpl.ejs` if foundation is in place) using GTM's declarative `scenarios:` syntax with `mock()`, `runCode()`, `assertApi()`, `assertThat()`. Covers each tag type's success and error paths. GTM runs these inside its real sandbox on every "Save" in the dashboard.
**Files modified:** `template.tpl` (or `template.tpl.ejs`)

#### 8. Bidirectional `sync` round-trip  *(needs foundation)*
**Problem:** Editing Fields/Info JSON by hand is painful. The GTM dashboard UI is the natural editor for the schema.
**Change:** Add `scripts/sync-template.js` — paste the GTM-exported `.tpl` over `template.tpl`, run `pnpm sync`, and the script splits it back into `libs/template-info.json`, `libs/template-parameters.json`, `libs/sandboxed-js.js`. Refuses to run if `libs/` has uncommitted changes (prevents data loss). **Preserves the `// exports:start … // exports:end` block** when rewriting `libs/sandboxed-js.js` — the GTM-exported `.tpl` won't contain it (it's stripped at build time per #9), so the script must read the existing `libs/sandboxed-js.js`, lift that block, and append it back after the splitter writes the new content.
**Files added:** `scripts/sync-template.js`
**Status:** Done on `chore/release-tooling-foundation` (`scripts/sync-template.js`).

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
**Change:** Extend the release workflow (#1) to copy `template.tpl → conviva-gtm.<short-sha>.tpl` and attach it as a Release asset alongside the change notes (`gh release create … "$TEMPLATE_NAME"`).
**Files modified:** `.github/workflows/update-template-metadata.yml`
**Note:** Amplitude does this in the same PR as #1; for Conviva it's split because PR #6 already shipped #1 without the asset.

#### 12. `yaml-lint metadata.yaml` CI step  *(standalone — runs in two workflows)*
**Problem:** A malformed `metadata.yaml` silently breaks the GTM Gallery submission.
**Change:** Add a yaml-lint step in **both** the build CI workflow (#6, on every PR) **and** the release workflow (#1, as a publish-time guard). PR #6's release workflow already validates with `python3 -c "yaml.safe_load(...)"` — keep that or swap to `npx yaml-lint` to match the build CI; consistency over per-workflow choice.
**Files modified:** `.github/workflows/build.yml`, `.github/workflows/update-template-metadata.yml`

#### 13. Supply-chain hardening for pnpm  *(needs foundation)*
**Problem:** Newly-published npm packages are a known supply-chain attack vector. Postinstall scripts can run arbitrary code. Transitive dependencies can pull in unvetted code.
**Change:** Add the following to `pnpm-workspace.yaml`:

```yaml
blockExoticSubdeps: true              # block git/file:/tarball deps from transitives
minimumReleaseAge: 4320                 # 4320 minutes = 3 days; refuse newly-published versions
onlyBuiltDependencies:                  # explicit allowlist for postinstall scripts
  - <add only after vetting, e.g. esbuild, unrs-resolver if Vite needs them>
trustPolicy: true                       # require lockfile integrity to match registry
```

`minimumReleaseAge` is **minutes**, not days (Amplitude's `4320` = 3 × 24 × 60). Settings only exist for pnpm; another reason the foundation pinned pnpm.
**Files added/modified:** `pnpm-workspace.yaml`

#### 14. Bot committer for release commits  *(extends #1)*
**Problem:** Hard to filter automation commits from human commits in `git log`.
**Change:** In the release workflow (#1), set the commit author to a bot identity (e.g., `conviva-gtm-bot <conviva-gtm-bot@users.noreply.github.com>`). PR #6 currently uses `github-actions[bot]` as a placeholder. Pick the identity now (open question: noreply email vs. a real `bot@conviva.com` mailbox?) so the very first automated release commit on `main` uses the final identity.
**Files modified:** `.github/workflows/update-template-metadata.yml`

#### 15. Snapshot tests for assembled config shape  *(needs foundation)*
**Problem:** Field schema changes are hard to spot in PR review when buried in JSON. Output-generation logic (e.g., the function that turns `data` into the SDK init payload) is also brittle to silent regressions.
**Change:** Two uses of `toMatchSnapshot()`:

1. The shape of `template-parameters.json` itself — schema changes show up as snapshot diffs.
2. The output of internal sandbox functions (e.g., `generateConfiguration(data)`, `mergeObject(...)`, etc.) given the kitchen-sink mock — exposed via the `__EXPORTS__` hatch from #9.

Amplitude does both; the second use is the bigger payoff and the one we'd actually catch regressions with.
**Files added:** `tests/template-parameters.snapshot.spec.ts`, `tests/__snapshots__/*.snap`, plus per-function snapshot specs as we add them

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
**Change:** Add `.github/workflows/jira-issue-creator.yml` that mirrors new GitHub issues into a designated Jira project on `conviva.atlassian.net`. **Implementation choice (open):** Amplitude `uses:` a reusable workflow from `amplitude/Amplitude-TypeScript` (private to their org — not reusable from Conviva). Three options:

| Option | What | Trade-off |
|---|---|---|
| (a) inline job | Write the curl-to-Jira bash directly in this workflow | Most control; ~30 lines of bash |
| (b) third-party action | Use [`atlassian/gajira-create`](https://github.com/atlassian/gajira-create) (Atlassian-published) | Smallest yaml; depends on a third-party action being maintained |
| (c) fork the reusable template | Vendor a `jira-issue-create-template.yml` into a Conviva-owned repo (e.g., `Conviva/.github`), then `uses:` it | Mirrors Amplitude's pattern; needs a separate repo to host it |

Pick at implementation time. Amplitude's reusable template internally uses the Atlassian REST API directly (no third-party action), which leans toward (a) or (c).
**Files added:** `.github/workflows/jira-issue-creator.yml`
**Secrets needed:** `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT`

### Items added during the Amplitude verification pass

#### 19. Pull request template  *(standalone)*
**Problem:** Reviewers can miss whether a PR's `template.tpl` change was actually tested in tagmanager.google.com Preview mode, or whether the latest `template.tpl` (post-rebase) was the one tested.
**Change:** Add `.github/pull_request_template.md` with a checklist:
- Did you test in tagmanager.google.com Preview mode?
- Did you re-test after the most recent `template.tpl` rebuild?
- Did you attach screenshots or a recording?
**Files added:** `.github/pull_request_template.md`
**Status:** Done on `chore/release-tooling-foundation`.

#### 20. `.cursorrules` for AI coding tools  *(standalone)*
**Problem:** Coding agents (Cursor, Claude, etc.) need project conventions to write idiomatic code — file naming, lint exceptions, "never edit generated files," "no breaking changes to `template-parameters.json` / `sandboxed-js.js`," etc. Without explicit rules, agents drift.
**Change:** Add `.cursorrules` at repo root documenting: TS conventions (single quotes, 2-space indent, semicolons), file naming (`kebab-case.ts`, `*.spec.ts`), generated files that must not be edited (`libs/*`, `src/generated-types.ts`, `template.tpl`), GTM-specific rules (sandboxed-js stays single-file, no DOM access, use polyfills for APIs), the "no breaking changes" rule for fields/sandboxed JS. Borrow heavily from Amplitude's `.cursorrules`.
**Files added:** `.cursorrules`

#### 21. README rewrite for new build/sync/dev flow  *(needs foundation)*
**Problem:** The current README documents the hand-edited-template workflow. Once the foundation lands, every command in the README is wrong.
**Change:** Rewrite `README.md` to cover: install (`pnpm install`), build (`pnpm build`), local dev (`pnpm dev` + env setup), unit tests (`pnpm test`), e2e (`pnpm test:e2e`), the GTM Live Preview Testing flow, and the `pnpm sync` round-trip workflow. Add a "Making changes to fields/info" section mirroring Amplitude's. Land in the same PR as the foundation, or as the immediate follow-up.
**Files modified:** `README.md`

#### 22. SHA-pin all GitHub Actions  *(standalone — policy item)*
**Problem:** GitHub Actions referenced by tag (`@v4`) silently move when the tag is re-pointed; this is a known supply-chain attack surface.
**Change:** Adopt a policy that every `uses:` in every workflow pins to a 40-char commit SHA with the version tag in a comment:
```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```
PR #6's `update-template-metadata.yml` already follows this. Audit any new workflow added by items #5, #6, #18 to make sure they do too. Optionally add a CI check (e.g., `jonasrutishauser/action-rebase-pinned-versions` or a small script) that fails if any `uses:` lacks a SHA.
**Files modified:** every `.github/workflows/*.yml` (audited per item)

---

## Delivery to `main`

**Policy (locked in):** Complete the plan on **`develop`**, verify everything, then merge **`develop` → `main`** once. Do **not** merge partial tooling work to `main` item-by-item. Intermediate PRs go **`topic branch` → `develop`** only.

| Phase | Where work lives | `develop` | `main` |
|---|---|---|---|
| In progress | Topic branches → PRs into `develop` (active work may stay on `chore/release-tooling-foundation` until merged) | Accumulates tooling commits | Unchanged until final promotion |
| Slice ready (optional) | Verified bucket (e.g. foundation + #1) | Merge PR from working branch when green | Still unchanged |
| Program complete | All 22 items on `develop` | Verification checklist green | One PR: **`develop` → `main`** |
| After promotion | — | Stays integration branch for future work | Full pipeline + release workflow (#1) for gallery metadata bumps |

**Verification checklist (run on `develop` before `develop` → `main`):**

1. `pnpm install`
2. `pnpm lint`
3. `pnpm build` and `git diff --quiet` (generated `template.tpl` / `src/generated-types.ts` committed)
4. `pnpm type-check`
5. `pnpm test` (coverage thresholds per #6)
6. `pnpm test:e2e` when #5 is implemented (or explicitly waived with user sign-off)
7. Manual: GTM Preview smoke on the built `template.tpl` (README / PR template checklist)
8. All new `.github/workflows/*.yml` use SHA-pinned `uses:` (#22)

Item **#1** is on `chore/release-tooling` today; it reaches `main` only when `develop` (containing #1 + the rest) is promoted after verification.

---

## Execution model

For each item, in order:

1. Brief discussion of approach + open questions.
2. User confirms.
3. Implement, test, commit on a topic branch (e.g. continue on `chore/release-tooling-foundation`, or `chore/playwright-e2e`).
4. Open a PR **into `develop`** when that slice is in good shape (or batch until the full plan is done — user preference: complete + verify first, then merge to `develop` in larger chunks is OK).
5. Move to next item — **do not merge to `main` yet**.
6. When all items are on `develop`, run the [verification checklist](#delivery-to-main) on `develop`, then open **`develop` → `main`**.

**Standalone items (no foundation needed):** #1 (on `chore/release-tooling`, included in foundation branch history), #5, #11, #12, #14, #18, #19, #20, #22 — land on `develop` with the rest; reach `main` only via final `develop` → `main`.

**Needs foundation:** all others. Foundation is implemented on `chore/release-tooling-foundation`; package-manager and delivery-shape decisions are locked in (pnpm; foundation as one bucket, promoted through `develop`, not directly to `main`).
