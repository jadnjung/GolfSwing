# Checklist

Status-at-a-glance for what's done, in progress, and not started, for anyone joining the project. Structured after `docs/PRD.md` section 16 (Delivery Roadmap) and section 3.1 (MVP Scope) — every item traces back to a PRD section, not invented here.

- For **why/how** something was done (decisions, commits, bugs fixed), see `Progress.md`.
- For **what** the finished product must do, see `docs/PRD.md`.
- Check an item only when it's actually done and validated — not when work has merely started (use "in progress" text instead).

---

## Foundational / DevOps (prerequisite infrastructure, not a PRD roadmap phase)

- [x] Monorepo scaffold, version-pinned toolchain, ADR process (`docs/adr/0001`, `0002`)
- [x] TypeScript strict config, ESLint, Prettier, EditorConfig
- [x] CI pipeline: lint, format, typecheck, test, dependency audit, secret scan (`.github/workflows/pr-checks.yml`)
- [x] Local machine provisioned and verified (`scripts/doctor.sh`)
- [x] Governance files: LICENSE, SECURITY.md, CONTRIBUTING.md, PR template, Dependabot
- [ ] `.github/CODEOWNERS` has a real GitHub handle (currently placeholder)
- [ ] CI Actions pinned by commit SHA (currently version tags)
- [ ] Xcode installed (manual, App Store)
- [ ] Android Studio + JDK 17 installed (manual)

## Phase 0: Product and Technical Discovery (PRD 16)

- [ ] Final product scope
- [ ] Supported device matrix
- [ ] Camera proof of concept
- [ ] Pose-model benchmark
- [ ] Ball-tracking feasibility report
- [ ] Swing-angle definitions
- [ ] Golf-instructor review
- [ ] Privacy architecture (drafted in PRD section 9; not yet built as an in-app flow)
- [ ] UX prototype
- [x] Architecture decision records (ongoing process, `docs/adr/`)

**Exit criteria:** reliable single-camera capture; pose inference works on representative iOS/Android devices; at least one face-on and one down-the-line metric calculable consistently; storage/replay workflow demonstrated; dual-camera capability boundaries documented. — **not yet met**

## Phase 1: Recording Foundation (PRD 16)

- [ ] React Native shell — in progress (Step 2, this session)
- [ ] Native camera modules (`native/ios-swing-capture`, `native/android-swing-capture`)
- [ ] Permission flows
- [ ] Recording setup screen
- [ ] Front/rear camera selection
- [ ] Local video storage
- [ ] Replay
- [ ] History
- [ ] Crash handling
- [x] CI pipeline

## Phase 2: Pose Analysis MVP (PRD 16)

- [ ] Pose inference (`native/ios-pose-inference`, `native/android-pose-inference`)
- [ ] Skeleton overlay
- [ ] Landmark smoothing
- [ ] Phase estimation
- [ ] Core angles (`packages/analysis-engine`)
- [ ] Recording-quality score
- [ ] Basic feedback rules (`packages/feedback-rules`)
- [ ] Analysis persistence (`packages/local-database`)

## Phase 3: Comparison and Coaching Verification (PRD 16)

- [ ] Side-by-side playback
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

1. [ ] Local user profile
2. [ ] Front- or rear-camera selection
3. [ ] Rear-camera default
4. [ ] Landscape recording mode
5. [ ] 30/60 FPS recording where supported
6. [ ] Video countdown timer
7. [ ] Manual recording start/stop
8. [ ] Automatic swing-event detection where reliable
9. [ ] On-device human-pose detection
10. [ ] Pose skeleton overlay
11. [ ] Joint-angle calculations
12. [ ] Basic golf swing phase detection
13. [ ] Post-swing feedback
14. [ ] Local swing storage
15. [ ] Swing-history screen
16. [ ] Video replay
17. [ ] Slow-motion playback
18. [ ] Frame-by-frame scrubbing
19. [ ] Swing tagging
20. [ ] Side-by-side comparison with a previous swing
21. [ ] Local deletion
22. [ ] Local export of an annotated video
23. [ ] Privacy and permission screens
24. [ ] Crash reporting that does not upload swing videos or pose data
