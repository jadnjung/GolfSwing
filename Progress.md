# Progress Log

Running record of completed work on the Golf Swing App. Updated after every successfully completed task — newest entries at the top. See `docs/PRD.md` for the full spec and `docs/adr/` for architecture decisions.

Entries before 2026-08-02 22:40 KST were backfilled with timestamps from `git log --format=%ai` (the commit that captured that work), not the actual time work started — later entries are timestamped live as the task completes.

---

## 2026-08-02 22:40 KST — Add timestamps to Progress.md entries

- Backfilled existing entries with timestamps from `git log --format=%ai` for the commit that captured each piece of work.
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

Step 2 (in progress): scaffold the React Native app shell at `apps/mobile` — RN 0.81.6, navigation-only (Home/Record/History/Training/Settings placeholder screens), no camera/pose native modules yet. Plan approved; see `/Users/jadenjung/.claude/plans/tender-moseying-acorn.md`.
