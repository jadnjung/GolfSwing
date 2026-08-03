# Checklist

Status-at-a-glance for what's done, in progress, and not started, for anyone joining the project. Structured after `docs/PRD.md` section 16 (Delivery Roadmap) and section 3.1 (MVP Scope) — every item traces back to a PRD section, not invented here.

- For **why/how** something was done (decisions, commits, bugs fixed), see `Progress.md`.
- For **what** the finished product must do, see `docs/PRD.md`.
- Check an item only when it's actually done and validated — not when work has merely started (use "in progress" text instead).

---

## Foundational / DevOps (prerequisite infrastructure, not a PRD roadmap phase)

- [x] Monorepo scaffold, version-pinned toolchain, ADR process (`docs/adr/0001`–`0006`)
- [x] TypeScript strict config, ESLint, Prettier, EditorConfig
- [x] CI pipeline: lint, format, typecheck, test, dependency audit, secret scan (`.github/workflows/pr-checks.yml`)
- [x] Local machine provisioned and verified (`scripts/doctor.sh`)
- [x] Governance files: LICENSE, SECURITY.md, CONTRIBUTING.md, PR template, Dependabot
- [ ] `.github/CODEOWNERS` has a real GitHub handle (currently placeholder)
- [ ] CI Actions pinned by commit SHA (currently version tags)
- [x] Xcode installed (26.6)
- [x] Android Studio + JDK 17 installed (JDK 17 via a local Temurin tarball, no `sudo` — see `docs/adr/0010-real-build-verification.md`)

## Phase 0: Product and Technical Discovery (PRD 16)

- [ ] Final product scope (several PRD section 22 decisions still open, e.g. min Android API level as a _product_ choice, subscription price, free-tier limits)
- [x] Supported device matrix (`docs/qa/device-matrix.md` — capability tiers and minimum OS versions defined; physical device acquisition/testing itself still pending, see the doc's own caveats)
- [ ] Camera proof of concept (app builds and runs on a real iOS simulator and Android emulator now, Steps 11–12 — but actual camera capture/recording still needs a physical device, simulators/emulators have no real camera)
- [ ] Pose-model benchmark (blocked on the pose-inference library decision — real device access alone doesn't unblock this, see `docs/adr/0009-defer-pose-inference-library.md`)
- [x] Ball-tracking feasibility report (`docs/architecture/ball-tracking-feasibility.md` — desk assessment against PRD 5.6's four levels; no measured accuracy, since that needs real recorded footage)
- [x] Swing-angle definitions (`docs/architecture/swing-angle-definitions.md` — maps every PRD 5.3 measurement to specific landmarks/formulas; surfaced that handedness isn't captured anywhere in the app yet)
- [ ] Golf-instructor review (needs a real domain-expert reviewer — not something this agent can substitute for)
- [x] Privacy architecture (drafted in PRD section 9; now built as an in-app flow — `OnboardingScreen`'s privacy notice step, Step 10)
- [ ] UX prototype (needs real user testing to count as validated, not just a written wireframe)
- [x] Architecture decision records (ongoing process, `docs/adr/`)

**Exit criteria:** reliable single-camera capture; pose inference works on representative iOS/Android devices; at least one face-on and one down-the-line metric calculable consistently; storage/replay workflow demonstrated; dual-camera capability boundaries documented. — **not yet met** (the app now builds and runs on both a real iOS simulator and Android emulator, Steps 11–12, but "reliable single-camera capture" needs a physical device with an actual camera to verify; pose inference is still blocked entirely)

## Phase 1: Recording Foundation (PRD 16)

- [x] React Native shell (`apps/mobile`, RN 0.81.6 — navigation + placeholder screens only, no camera/pose logic)
- [ ] Native camera modules (`native/ios-swing-capture`, `native/android-swing-capture` — repurposed to future frame-processor plugins per `docs/adr/0004`; base capture is `react-native-vision-camera` instead, not hand-written)
- [x] Permission flows (camera + microphone, via `react-native-vision-camera`'s permission API — app builds and boots on a real iOS simulator now, Step 11; actual permission prompts still need a physical device/real camera hardware to fully exercise)
- [x] Recording setup screen (club/view/camera/frame-rate/audio selectors + live camera preview once permission is granted — build-verified, Step 11; simulators have no camera so the live preview itself is still unverified)
- [x] Front/rear camera selection (dual explicitly not offered — needs a real device to check concurrent-camera capability)
- [x] Local video storage (countdown → record → save to `<DocumentDirectoryPath>/swings/<id>/source.mp4` + `analysis-manifest.json`, via `@dr.pogodin/react-native-fs` — build-verified, Step 11)
- [x] Replay (`ReplayScreen`, pushed from `HistoryScreen` via a nested stack navigator; `react-native-video` — build-verified, Step 11)
- [x] History (`HistoryScreen` lists saved swings via `swingRepository.listSwings()`, scanning the filesystem — build-verified, Step 11; actually installed, launched, and screenshotted running on a real iOS simulator)
- [x] Crash handling (`ErrorBoundary` + global JS error handler + rotating local diagnostic log; external crash-reporting SDK deliberately deferred to Phase 6, see `docs/adr/0008-crash-handling-scope.md`)
- [x] CI pipeline

## Phase 2: Pose Analysis MVP (PRD 16)

- [ ] Pose inference (`native/ios-pose-inference`, `native/android-pose-inference` — library choice deliberately deferred, see `docs/adr/0009-defer-pose-inference-library.md`)
- [ ] Skeleton overlay
- [ ] Landmark smoothing
- [ ] Phase estimation
- [ ] Core angles (`packages/analysis-engine` — the PRD 5.3 angle formula itself is implemented and tested; applying it to real named joint angles needs real landmark data, which nothing produces yet)
- [ ] Recording-quality score
- [ ] Basic feedback rules (`packages/feedback-rules`)
- [ ] Analysis persistence (`packages/local-database`)

## Phase 3: Comparison and Coaching Verification (PRD 16)

- [ ] Side-by-side playback (basic MVP version done — see MVP item 20; still missing phase synchronization, overlays, and metric deltas, which need Phase 2 pose data)
- [ ] Phase synchronization
- [ ] Metric deltas
- [ ] Baseline goals
- [ ] Coaching-feedback verification
- [ ] Trend history
- [ ] Annotated export

## Phase 4: Advanced Coaching (PRD 16)

- [ ] Personalized training plans
- [ ] Drill library
- [ ] Advanced feedback
- [ ] Professional comparison
- [ ] Instructor validation
- [ ] Beginner and advanced modes

## Phase 5: Experimental Tracking (PRD 16)

- [ ] Club tracking
- [ ] Initial ball detection
- [ ] Ball-path confidence model
- [ ] Supported dual-camera recording
- [ ] Device-capability testing
- [ ] Performance optimization

## Phase 6: Commercial Launch (PRD 16)

- [ ] Subscription
- [ ] Store assets
- [ ] Privacy forms (App Store / Google Play declarations, PRD section 15)
- [ ] Beta program
- [ ] Staged rollout
- [ ] Support process
- [ ] Production dashboards
- [ ] Incident response plan

---

## MVP scope tracker (PRD 3.1 — the 24-item list, cross-cutting across phases above)

1. [x] Local user profile (`OnboardingScreen` + `profileStore`/`profileRepository` — handedness, skill level, primary club, units; stored at `<DocumentDirectoryPath>/profile.json` — build-verified, Step 11: actually persisted through a real onboarding flow on a real iOS simulator)
2. [x] Front- or rear-camera selection
3. [x] Rear-camera default
4. [x] Landscape recording mode (`RecordScreen`'s camera preview locks to landscape via `react-native-orientation-locker` while this tab is focused and the camera is ready — PRD 2.4/3.1 — `docs/adr/0013-landscape-recording-mode.md`; Android build-verified on a real emulator, iOS builds successfully but tap-driven UI verification wasn't possible in this environment)
5. [ ] 30/60 FPS recording where supported (selector exists in UI; not yet wired to an actual device format/fps)
6. [x] Video countdown timer
7. [x] Manual recording start/stop
8. [ ] Automatic swing-event detection where reliable
9. [ ] On-device human-pose detection
10. [ ] Pose skeleton overlay
11. [ ] Joint-angle calculations
12. [ ] Basic golf swing phase detection
13. [ ] Post-swing feedback
14. [x] Local swing storage
15. [x] Swing-history screen
16. [x] Video replay
17. [x] Slow-motion playback (`ReplayScreen`'s 1x/0.5x/0.25x rate buttons, driven by `react-native-video`'s `rate` prop — PRD 5.10 — not build-verified)
18. [x] Frame-by-frame scrubbing (`ReplayScreen`'s frame-step buttons, seeking by one frame duration computed from the swing's recorded `frameRate` via the new `swingRepository.getSwing` — PRD 5.10 — not build-verified)
19. [x] Swing tagging (`HistoryScreen`'s tag editor modal — add/remove free-text tags per swing, persisted via `swingRepository.setSwingTags` — PRD 5.11 — not build-verified)
20. [x] Side-by-side comparison with a previous swing (`SelectComparisonSwingScreen` picks a second swing, `CompareScreen` plays both independently, stacked — no phase sync/overlays yet, those need Phase 2 — not build-verified)
21. [x] Local deletion (`HistoryScreen`'s "Delete" button per swing, confirmation via `Alert.alert` including the estimated storage freed, `swingRepository.deleteSwing` removes the whole swing directory — PRD 9.8; `SettingsScreen`'s "Delete all data" control adds the delete-all-data tier, same storage estimate — not build-verified)
22. [ ] Local export of an annotated video (`ReplayScreen`'s "Export" button shares the raw source video via `react-native-share` — PRD 9.3/5.10 — not "annotated," since overlay data doesn't exist until Phase 2; see `docs/adr/0011-video-export-library.md` — not build-verified)
23. [x] Privacy and permission screens (privacy notice in `OnboardingScreen`'s first step; camera/mic permission gate already existed in `RecordScreen`, Step 3)
24. [x] Crash reporting that does not upload swing videos or pose data (local-only error boundary + diagnostic log; no network path exists at all yet, so nothing uploads anything — external SDK integration deferred, see `docs/adr/0008-crash-handling-scope.md`)
