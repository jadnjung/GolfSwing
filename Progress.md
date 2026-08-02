# Progress Log

Running record of completed work on the Golf Swing App. Updated after every successfully completed task — newest entries at the top. See `docs/PRD.md` for the full spec and `docs/adr/` for architecture decisions.

Entries before 2026-08-02 22:40 KST were backfilled with timestamps from `git log --format=%ai` (the commit that captured that work), not the actual time work started — later entries are timestamped live as the task completes.

---

## 2026-08-03 00:50 KST — Broaden Bash permission allowlist

- Added `Bash(*)` to `.claude/settings.json` per explicit request, so routine commands stop prompting for approval during active development. Kept the earlier exact-match `pnpm run *` rules alongside it (harmless overlap). Continuing to exercise independent judgment to keep actions scoped to this repo and avoid destructive operations, since permission patterns can't enforce a filesystem boundary themselves.

## 2026-08-03 01:04 KST — Step 2: React Native app shell (`apps/mobile`)

Scoped to shell only, per plan: navigation + placeholder screens, no camera/pose/native modules yet (those are a later step).

**Version decision:** Checked the live npm registry — latest stable React Native is 0.86.2, but `react-native-reanimated` 4.x (needed later for overlay/timeline UI) requires RN 0.83–0.86 specifically, while reanimated 3.x has no such constraint. Pinned **React Native 0.81.6** instead of `@latest` to avoid locking in that narrow range before it's needed. Recorded in `docs/adr/0003-react-native-version.md`; `docs/adr/0002-toolchain-baseline.md` and `docs/architecture/toolchain.md` updated to point at it instead of staying `PENDING`. Also resolved Android `compileSdk`/`targetSdk` 36, `minSdk` 24 from RN 0.81.6's own gradle version catalog.

**Generated** via the official `@react-native-community/cli init` (not hand-rolled) targeting `react-native@0.81.6` / `@react-native-community/template@0.81.6` explicitly, into `apps/mobile`, with `--skip-install` and `--skip-git-init` (root pnpm/git manage this instead).

**Wired into the monorepo** — several real, non-obvious fixes along the way, not just config boilerplate:

- `apps/mobile/package.json` renamed to `@golf-swing/mobile`, `typecheck` script added.
- `tsconfig.json` extends both `@react-native/typescript-config` and the root `tsconfig.base.json` (TS 5's multi-extends), with `forceConsistentCasingInFileNames` explicitly re-overridden to `false` — RN's config deliberately disables it ("causes issues with package.json exports") and our stricter base would have silently re-enabled it.
- `metro.config.js` made monorepo-aware: `watchFolders` includes the workspace root, `resolver.nodeModulesPaths` covers both local and root `node_modules`, `unstable_enableSymlinks: true` for pnpm's symlinked structure.
- **Bug found:** ESLint 8.57 (used by RN's template) auto-detects `eslint.config.js`/`.mjs` by searching _upward_ through parent directories — it found the root's flat config, applied its ignores (which include `apps/mobile/**`), and concluded there was nothing to lint. Fixed by forcing legacy config resolution for this package specifically: `ESLINT_USE_FLAT_CONFIG=false eslint .`. Root `eslint.config.mjs` now explicitly ignores `apps/mobile/**` (it lints itself, independently), and root `package.json`'s `lint` script runs both the root flat-config lint and `pnpm -r --if-present run lint` so per-package lint scripts (like this one) actually execute.
- **Bug found:** RN's default Jest `transformIgnorePatterns` assumes packages live directly under one `node_modules/` — pnpm nests them as `node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>/`, so the default pattern silently skipped transforming `react-native` and `@react-navigation/*`, causing `SyntaxError: Cannot use import statement outside a module`. Fixed with a corrected pattern in `apps/mobile/jest.config.js` that accounts for the optional pnpm nesting before checking package names.
- **Bug found:** `react-native-safe-area-context`'s `SafeAreaProvider` needs real layout measurement to resolve insets, which never happens under `react-test-renderer` — it rendered its children as permanently `null`. Fixed via the library's own documented Jest mock (`jest.setup.js`), correcting one further wrinkle: the mock file uses `export default {...}`, so a plain `require()` of the Babel-compiled output returns `{ default: {...} }`, not the object itself — had to unwrap `.default` explicitly or every named import resolved to `undefined`.
- Same Watchman-hang issue as `packages/tooling-smoke-test` (see 2026-08-02 entry below) reproduced here too; fixed the same way (`watchman: false` in Jest config).
- Deliberately did **not** call `react-native-screens`' `enableScreens()` yet — it's a required peer of `@react-navigation/bottom-tabs` (installed, available for native builds) but has no Jest-safe mock for this version, and turned out to be unnecessary for a shell-only step.

**Source layout** reorganized into the PRD's documented structure: `src/{app,components,features,navigation,screens,state,theme}`. Added `@react-navigation/native` + `bottom-tabs` (5-tab layout: Home/Record/History/Training/Settings, PRD section 10.1) and Zustand with one real store (`useUiStore`, tracking the active tab) — proven genuinely wired via `ActiveTabBanner`, a component every screen renders that reads the store reactively, plus a real test (`__tests__/App.test.tsx`) asserting the rendered text actually reflects it, not just that something rendered without crashing.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` — all green, across all three workspace packages.

**Known open items:**

- iOS/Android native builds are **not verified** in this environment — needs Xcode ≥ 16.1 and Android Studio/JDK 17 installed first (both still manual, flagged since Step 1).
- No camera capture, pose inference, or native Swift/Kotlin modules yet — separate, larger step.
- `react-native-screens`' `enableScreens()` deferred until native builds can actually be tested.

## 2026-08-02 22:45 KST — Add onboarding pointers to README

- README now tells a new contributor exactly what to read and in what order: `CLAUDE.md` (working agreement), `docs/PRD.md` (spec), `Checklist.md` (status at a glance), `Progress.md` (chronological log with reasoning), `docs/adr/` (specific technical decisions).

## 2026-08-02 22:43 KST — Add Checklist.md and timestamp Progress.md entries

- Added `Checklist.md`: a status-at-a-glance view (done/in-progress/not-started) structured after the PRD's delivery roadmap (section 16) and MVP scope (section 3.1), so a new contributor can see where the project stands without reading `Progress.md`'s full narrative. Distinct purpose from this log — check an item only when it's actually done and validated, not when work has merely started.
- Backfilled existing `Progress.md` entries with timestamps from `git log --format=%ai` for the commit that captured each piece of work.
- Every entry going forward includes a timestamp, not just a date.

## 2026-08-02 22:33 KST — Reduce permission prompts

- Added `.claude/settings.json` with a `permissions.allow` allowlist for read-only, non-mutating commands: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run doctor`, `pnpm run format` (exact matches only — deliberately not wildcarded, since `pnpm run *` would also allow mutating scripts like `format:write`).
- Scanned available session transcripts for repeated Bash/MCP calls; found no other qualifying patterns — most commands were wrapped in a one-off PATH/fnm/rbenv activation preamble, which prevents subcommand-level allowlist rules from matching, and everything else that repeated (`git status`, `ls`, `cat`, `head`, `tail`, `wc`, `find`, `grep`, `git branch`) is already covered by Claude Code's built-in read-only auto-allow list.
- Open item: activation preamble could be removed by adding `eval "$(fnm env --use-on-cd)"` and `eval "$(rbenv init -)"` to the shell profile (`~/.zshrc`) — not yet done, since that's outside the project directory.

## 2026-08-02 22:16 KST — Commit and push Step 1 work to V1 branch

- Read the user-supplied `CLAUDE.md` (agent working agreement: validate before every commit, one logical task per commit, no unrequested pushes/force-pushes/history rewrites) and the complete `docs/PRD.md` (sections 1–23), which superseded the earlier truncated `docs/prd-draft.md` (removed; `README.md`/`SECURITY.md` updated to point at `docs/PRD.md`).
- Created local branch `V1` off `main` (kept intentionally separate from `main` per instruction — no merging).
- Re-ran full validation (`pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm test`, `pnpm doctor`) — all green, including auto-formatting `CLAUDE.md`/`docs/PRD.md` to satisfy the repo's Prettier check.
- Committed in two logical commits:
  1. `c59f5fb` — Step 1 tooling, CI, and dev environment scaffold.
  2. `b5d352f` — `CLAUDE.md` and complete `docs/PRD.md`.
- Pushed `V1` to `origin/V1` (clean fast-forward, no force needed). `main` left untouched on both local and remote.

## 2026-08-02 22:16 KST — Step 1: Development environment & tooling setup

Scoped deliberately to tooling/config only — no React Native app code yet.

**Toolchain decision (ADR):** React Native 0.81.x target (exact patch TBD at app-scaffold time), Node 22 LTS, pnpm 10.x, Ruby 3.3.x, JDK 17, Xcode ≥ 16.1 — chosen based on what the project will need, not what happened to already be on the dev machine. Recorded in `docs/adr/0002-toolchain-baseline.md`.

**Repository foundations:**

- Monorepo skeleton per the architecture spec: `apps/`, `packages/{domain,analysis-engine,feedback-rules,local-database,design-system,shared-types,test-fixtures,tooling-smoke-test}/`, `native/{ios,android}-{swing-capture,pose-inference}/`, `models/{pose,club,phase-classifier,metadata}/`, `scripts/`, `docs/{adr,architecture,privacy,release,qa}/`.
- Version-pin files: `.nvmrc`, `.tool-versions`, `.ruby-version`, `package.json` (`packageManager`, `engines`), `.npmrc`, `pnpm-workspace.yaml`, `Gemfile`/`Gemfile.lock` (Ruby/Bundler only — CocoaPods/Fastlane deferred until there's an actual iOS project).
- TypeScript strict-mode base config, ESLint flat config, Prettier, `.editorconfig`, `.gitattributes`, `.gitignore`.
- A **real** workspace package, `packages/tooling-smoke-test`, with an actual Jest test — proves the pnpm workspace, TypeScript, ESLint, and test runner genuinely work, rather than relying on no-op CI steps.
- Governance files: `LICENSE` (proprietary/all-rights-reserved), `SECURITY.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS` (placeholder — needs a real GitHub handle), `.github/pull_request_template.md`, `.github/dependabot.yml`.
- CI workflow `.github/workflows/pr-checks.yml`: lint, format check, typecheck, test, `pnpm audit`, gitleaks secret scan. GitHub Actions pinned by version tag, not commit SHA yet (no network access available to resolve SHAs safely at the time — flagged as a follow-up, not silently done).
- `scripts/doctor.sh`: verifies a machine's installed toolchain against the repo's pins, reporting `OK`/`MISMATCH`/`MISSING` (Xcode/Android Studio correctly reported `MISSING` until manually installed).

**Local machine provisioned** (this dev machine): Watchman via Homebrew, rbenv + Ruby 3.3.12, fnm + Node 22.23.2, pnpm 10.34.5 via corepack. All version pins in the repo updated to match what was actually verified installed, not guessed.

**Bug found and fixed:** Jest hung indefinitely when its Watchman integration was enabled in this sandboxed environment; disabled via `watchman: false` in `packages/tooling-smoke-test/jest.config.mjs` (Jest's own file crawler is fast enough at this scale).

**Full verification passed:** `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` all green.

**Known open items (not yet done, intentionally not glossed over):**

- `.github/CODEOWNERS` has a placeholder owner (`@TODO-set-owner`) — needs the real GitHub handle.
- CI Actions pinned by tag, not commit SHA — needs network access to resolve real SHAs safely.
- Xcode and Android Studio/JDK 17 are manual installs on the dev machine — not yet done.
- React Native version (0.81.x) and Android compile/target SDK need re-confirmation as still current before Step 2 (app scaffolding) begins.

---

## Next up

Step 3 (not started): native camera capture modules (`native/ios-swing-capture`, `native/android-swing-capture`) and permission flows — PRD "Phase 1: Recording Foundation". Blocked on Xcode/Android Studio being installed for any real device/build verification.
