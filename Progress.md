# Progress Log

Running record of completed work on the Golf Swing App. Updated after every successfully completed task — newest entries at the top. See `docs/PRD.md` for the full spec and `docs/adr/` for architecture decisions.

Entries before 2026-08-02 22:40 KST were backfilled with timestamps from `git log --format=%ai` (the commit that captured that work), not the actual time work started — later entries are timestamped live as the task completes.

---

## 2026-08-03 11:45 KST — Step 6: Replay (video playback of a saved swing)

Scoped to Replay only, per the plan left at the end of Step 5 — a video-playback library decision, plus enough navigation to actually reach a saved swing's video from History.

**Library decision:** Checked npm for the realistic options. `react-native-video` 6.19.2 is the current stable line (66+ published 6.x releases, most recent 2026-07-07), with no narrow peer-version window to work around (`react: '*'`, `react-native: '*'`) — unlike the reanimated 4.x constraint hit in ADR 0003. Hand-writing an AVPlayer/ExoPlayer wrapper was rejected for the same reason ADR 0004 rejected hand-written camera capture: reimplementing a mature library, unverifiable in an environment with no Xcode/Android Studio anyway. `expo-video` was rejected per PRD section 7.4's existing rejection of managed-Expo dependencies for core native functionality. Recorded in `docs/adr/0007-video-playback-library.md`.

**Navigation decision:** The History tab was a single flat screen with no way to push a detail view. Added `@react-navigation/native-stack` 7.18.6 (same major as the already-installed `@react-navigation/native` 7.3.14) and a new `HistoryStackNavigator` (`HistoryList` → `Replay`), swapped in as the History tab's screen component in `RootNavigator`. `HistoryScreen` and `ReplayScreen` are typed against a shared `HistoryStackParamList` (`apps/mobile/src/navigation/types.ts`) and receive `navigation`/`route` as ordinary props from React Navigation — no `useNavigation()`/`useRoute()` hooks, consistent with how every other screen in this codebase is written so far.

**Built:**

- `swingRepository.ts` gained `swingVideoPath(swingId)`, deriving `<DocumentDirectoryPath>/swings/<id>/source.mp4` from the same layout `RecordScreen` already writes — no new stored field needed since the path is fully determined by the id.
- `HistoryScreen`'s `SwingRow` is now a `Pressable` that calls `navigation.navigate('Replay', { swingId })`.
- `ReplayScreen.tsx`: a `loading → ready/error` state machine around `<Video controls>`, covering PRD section 5.10's baseline (play/pause/scrubber, via the library's built-in controls) — deliberately not slow-motion speed control or frame-by-frame scrubbing (MVP items 17-18), which depend on pose data that doesn't exist until Phase 2 and are a separate, later step.

**Testing:** added a Jest mock for `react-native-video` in `jest.setup.js` (ships none, same treatment as vision-camera) exposing just the `onLoad`/`onError` callback surface `ReplayScreen` uses. New `ReplayScreen.test.tsx` (source path, loading state, load transitions to ready, error transitions to error state). Extended `HistoryScreen.test.tsx` with a navigation mock (`{ navigation: { navigate: jest.fn() } }` — no full `NavigationContainer` needed, since screens receive navigation as a prop) and a test asserting a row press calls `navigate('Replay', { swingId })`. Added a `swingVideoPath` unit test to `swingRepository.test.ts`.

**Bug caught by `tsc`:** `noUncheckedIndexedAccess` flagged `findAllByProps(...)[0]` as possibly `undefined` in the new navigation test — fixed with array destructuring plus a non-null assertion, since the preceding assertion already guarantees the row exists.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (5 mobile suites, 13 tests, plus the domain/tooling-smoke-test packages), `pnpm doctor` (Ruby only resolves correctly with `rbenv init` evaluated in the shell — known open item, not new) — all green.

**Known open items:**

- Playback is still not build-verified — no Xcode/Android Studio in this environment.
- Slow-motion, frame-by-frame scrubbing, swing tagging, deletion, and comparison are all still open (MVP items 17-22).
- Crash handling is the last unchecked Phase 1 deliverable — next step.

## 2026-08-03 02:08 KST — Step 5: Swing domain model + local repository + History screen

Scoped to reading back what Step 4 wrote — a shared `Swing` type, a repository that lists saved swings, and a real History screen. Deliberately not SQLite or Replay (see below and the next step).

**Revisited `packages/local-database`'s "SQLite" README** (written in Step 1, before any real swing data existed) now that swing history is actually needed. Decision: **defer SQLite** — `analysis-manifest.json` per swing already is the durable record, a personal local swing history is realistically hundreds of entries (not a query-performance problem), and SQLite would mean another native dependency that can't be compile-verified here for a scale problem that doesn't exist yet. Recorded in `docs/adr/0006-defer-sqlite.md`. `packages/local-database`'s README updated to point at it instead of implying SQLite is imminent.

**Built:**

- `packages/domain` got its first real content (previously just a README): a `Swing` type matching what `RecordScreen` actually writes, and `parseSwingManifest` — a validating parser that throws `InvalidSwingManifestError` on anything malformed rather than silently accepting partial data. Pure TypeScript, no React Native/I/O, with a real Jest test (10 cases: one valid manifest, nine rejection cases covering each field).
- `apps/mobile` now depends on `@golf-swing/domain` (`workspace:*`) — the first real cross-package import in this monorepo, exercising the monorepo Metro/pnpm/TypeScript wiring built in Step 2. Confirmed the symlink (`apps/mobile/node_modules/@golf-swing/domain -> packages/domain`) resolves correctly for both `tsc` and Jest without any extra configuration.
- `apps/mobile/src/data/swingRepository.ts`: `listSwings()` — `readDir`s the swings root, reads and parses each `analysis-manifest.json` via the domain package's parser, skips (warns, doesn't crash) any directory with a missing/corrupt manifest, sorts newest first. Returns `[]` rather than throwing when the swings directory doesn't exist yet (no swings recorded is not an error).
- `HistoryScreen.tsx` replaced (placeholder → real): loads swings on mount, renders a list (club, view, date, duration) with loading/empty/error states — real data flow, not a static mock list.

**Testing:** extended the RNFS mock with `readDir`; wrote a `swingRepository` test (mixed valid/corrupt/non-directory entries, asserting the corrupt one is skipped and sort order is correct) and a `HistoryScreen` test (empty state, and rendering real fetched swings).

**Bug caught while writing the `HistoryScreen` test:** same class of issue as Steps 2/4 — `{swing.clubType} · {swing.cameraView}` compiles to an array of JSX children (`['driver', ' · ', 'face-on']`), not one string, so a naive `children === 'driver'` check failed. Fixed the test helper to join array children before matching, consistent with the fix already applied in `App.test.tsx`.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (all 4 workspace packages, including the new `packages/domain`), `pnpm doctor` — all green.

**Known open items:**

- Reading real saved swings on an actual device is still not verified — no Xcode/Android Studio in this environment.
- Replay (video playback) is next — needs its own native-dependency decision (e.g. `react-native-video`) and its own test-mocking approach.
- No delete/export/tagging/comparison yet.

## 2026-08-03 01:55 KST — Step 4: Actual recording capture (countdown, start/stop, local file save)

Scoped deliberately to just recording + local file save — no SQLite/`packages/local-database`, History screen, or Replay yet, since those need something to list/play back, which only exists after this step.

**New dependency decision:** needed real filesystem access to move vision-camera's temporary recording output into stable local storage. Checked npm: the original `react-native-fs` hasn't published since **May 2022** (4+ years stale — too risky to trust against RN 0.81.6's New Architecture). `@dr.pogodin/react-native-fs` is an actively maintained fork of the same API, latest release **2026-07-03**. Same reasoning as ADRs 0003/0004: proven API, actively maintained fork over the abandoned original. Recorded in `docs/adr/0005-filesystem-library.md`. Storage root: `RNFS.DocumentDirectoryPath` (private by default on both platforms, not exposed via Files app/external storage unless the app opts in).

**Bug caught before it shipped:** `@dr.pogodin/react-native-fs` has **no default export**, only named exports (`mkdir`, `moveFile`, `writeFile`, `DocumentDirectoryPath`, etc.) — confirmed by reading its actual built output, not assumed from habit. My first draft used `import RNFS from '@dr.pogodin/react-native-fs'`, which would have been `undefined` at runtime. Fixed to named imports before it ever ran.

**Built:** `RecordScreen.tsx` now has a real capture state machine (`idle → counting → recording → saving → saved/error`): pressing "Record" starts a countdown using the selected `countdownSeconds` (3 or 10), then calls `camera.current.startRecording()` via a new camera `ref`; "Stop" calls `stopRecording()`. On `onRecordingFinished`, creates `<DocumentDirectoryPath>/swings/<uuid>/`, moves the video in as `source.mp4`, and writes `analysis-manifest.json` with only the fields we can actually populate today (id, createdAt, club/view/camera/frameRate, durationMs, `analysisStatus: 'pending'`) — no fake placeholders for fields that don't exist yet (pose data, metrics). A brief on-screen confirmation shows the saved swing id.

**Testing:** extended the vision-camera Jest mock with `useImperativeHandle`-exposed `startRecording`/`stopRecording` (they're instance methods called via ref, not statics), and added a manual mock for `@dr.pogodin/react-native-fs`. Two new tests drive real state transitions with fake timers: countdown → recording → save (asserting `mkdir`/`moveFile`/`writeFile` were called with the expected paths/content, not just "didn't crash"), and Stop actually calling `stopRecording`.

**Bugs found while writing the test, both fixed:**

- `jest.advanceTimersByTime(3000)` in one call didn't fire all three countdown ticks — each tick reschedules its own `setTimeout` from a `useEffect`, so React needs to flush a render between each one. Fixed by advancing 1000ms at a time across three separate `act()` calls.
- Two `no-bitwise`/`no-void` ESLint warnings from the UUID generator and a fire-and-forget async call — addressed directly (a scoped `eslint-disable` for the standard bitwise UUID idiom; removed the unnecessary `void` since nothing required suppressing the floating promise here).

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` — all green.

**Known open items:**

- Still not build-verified on a real device/simulator — no Xcode/Android Studio in this environment.
- Frame rate is a UI selector only, not yet wired to an actual `useCameraFormat`/device capability query.
- No SQLite/local-database repository, History screen, or Replay yet — next step.

## 2026-08-03 01:38 KST — Step 3: Camera capture screen (react-native-vision-camera) + permission flow

Per your direction, this step decided the camera capture library and installed it, rather than deferring that decision.

**Library decision:** Checked npm for the realistic paths. `react-native-vision-camera` `@latest` is 5.2.1 — a Nitro-Modules-based rewrite (mandatory `react-native-nitro-modules`/`react-native-nitro-image` peers) with a much larger, newer API surface (sessions, output configs, gesture controllers) and far less community track record. The 4.x line (latest 4.7.3, 29 releases since 4.0.0) uses the classic, extensively documented API, and its advanced-feature peers (`react-native-reanimated`, `@shopify/react-native-skia`, `react-native-worklets-core`) are all **optional** — not needed for plain photo/video capture. Same reasoning as ADR 0003 (RN 0.81.6 over `@latest`): picked the more proven, narrower-risk option, especially since neither is compile-verifiable in this environment. **Decision: `react-native-vision-camera` 4.7.3**, recorded in `docs/adr/0004-camera-capture-library.md`. `native/ios-swing-capture` and `native/android-swing-capture` READMEs updated — their purpose is now future custom frame-processor _plugins_ (e.g. the pose-inference bridge, Phase 2), not full camera capture reimplementation, since vision-camera already provides that.

**Built:**

- `RecordScreen.tsx` replaced (placeholder → real UI): permission gate showing live status via `Camera.getCameraPermissionStatus()`/`getMicrophonePermissionStatus()`, a real "Grant camera access" button calling `Camera.requestCameraPermission()`, and — once granted and a device is available — an actual `<Camera>` preview component, not a placeholder. Club/camera-view/frame-rate selectors and an audio toggle (PRD section 10.3). Front/rear selection via `useCameraDevice()`; dual camera deliberately not offered (PRD CAM-003/CAM-004 — concurrent-capture capability can only be checked on a real device).
- `recordingSetupStore.ts`: a real Zustand store (club/view/camera-position/frameRate/countdown/audio), same bar as `uiStore`.
- `Info.plist` (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`) and `AndroidManifest.xml` (`CAMERA`, `RECORD_AUDIO` permissions) — plain config, inspectable but not build-verified.
- A manual Jest mock for `react-native-vision-camera` in `jest.setup.js` (the library ships none for either version) covering the static permission methods and the `Camera`/`useCameraDevice` surface actually used, plus a real test (`RecordScreen.test.tsx`) driving an actual state transition — not-determined → request → granted → preview appears — rather than a render-without-crashing smoke test.

**Bugs found while writing the test, both fixed:**

- A generic function (`OptionRow<T extends string | number>`) in a `.tsx` file is ambiguous with JSX to some parsers — fixed with the standard trailing-comma disambiguation (`<T extends string | number,>`).
- `findAllByProps({ testID })` matches both the composite element and its underlying host node when the prop passes through unchanged, returning 2 matches for one visually-present element, not 1 — switched assertions to presence/absence (`.length > 0`) instead of an exact count.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` — all green.

**Known open items:**

- The vision-camera integration itself is **not build-verified** — still no Xcode/Android Studio in this environment; first real verification happens on an actual device/simulator once those are installed.
- Actually recording/saving video, the countdown timer, swing-event auto-detection, and frame processors (needed for Phase 2 pose inference) are still not implemented.
- Front/rear capability detection and frame-rate/format availability are shown as static options, not filtered by actual device capability (needs a live device to query).

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

Step 7 (not started): Crash handling — the last unchecked Phase 1: Recording Foundation deliverable. Once that's done, Phase 1 is functionally complete (modulo build verification) and work moves to Phase 2: Pose Analysis MVP. Real device/build verification for everything camera- and video-related is still blocked on Xcode/Android Studio being installed.
