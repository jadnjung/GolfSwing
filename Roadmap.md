# Delivery Roadmap

This document is the planned-phases-and-priorities reference described in `CLAUDE.md`'s "Project Documentation" section. It was extracted from the original combined PRD (`docs/PRD.md`, now `Project.md`).

For what has actually been completed against this roadmap, see `Progress.md` (chronological log) and `Checklist.md` (status at a glance). The phases and proof-of-concept plan below are the original planned sequence; actual delivery order and status may differ — `Checklist.md` is the source of truth for current status.

Section numbers below are preserved from the original PRD for traceability.

---

# 16. Delivery Roadmap

## Phase 0: Product and Technical Discovery

Deliverables:

- Final product scope.
- Supported device matrix.
- Camera proof of concept.
- Pose-model benchmark.
- Ball-tracking feasibility report.
- Swing-angle definitions.
- Golf-instructor review.
- Privacy architecture.
- UX prototype.
- Architecture decision records.

Exit criteria:

- Reliable single-camera video capture.
- Pose inference works on representative iOS and Android devices.
- At least one face-on and one down-the-line metric can be calculated consistently.
- Storage and replay workflow demonstrated.
- Dual-camera capability boundaries documented.

## Phase 1: Recording Foundation

Deliverables:

- React Native shell.
- Native camera modules.
- Permission flows.
- Recording setup.
- Front/rear selection.
- Local video storage.
- Replay.
- History.
- Crash handling.
- CI pipeline.

## Phase 2: Pose Analysis MVP

Deliverables:

- Pose inference.
- Skeleton overlay.
- Landmark smoothing.
- Phase estimation.
- Core angles.
- Recording-quality score.
- Basic feedback rules.
- Analysis persistence.

## Phase 3: Comparison and Coaching Verification

Deliverables:

- Side-by-side playback.
- Phase synchronization.
- Metric deltas.
- Baseline goals.
- Coaching-feedback verification.
- Trend history.
- Annotated export.

## Phase 4: Advanced Coaching

Deliverables:

- Personalized training plans.
- Drill library.
- Advanced feedback.
- Professional comparison.
- Instructor validation.
- Beginner and advanced modes.

## Phase 5: Experimental Tracking

Deliverables:

- Club tracking.
- Initial ball detection.
- Ball-path confidence model.
- Supported dual-camera recording.
- Device-capability testing.
- Performance optimization.

## Phase 6: Commercial Launch

Deliverables:

- Subscription.
- Store assets.
- Privacy forms.
- Beta program.
- Staged rollout.
- Support process.
- Production dashboards.
- Incident response plan.

---

# 17. Team Requirements

Minimum recommended roles:

- Product manager.
- React Native engineer.
- iOS engineer with AVFoundation experience.
- Android engineer with CameraX experience.
- Computer-vision or machine-learning engineer.
- Backend or platform engineer for CI, releases, purchases, and optional services.
- DevOps or mobile release engineer.
- Product designer.
- QA automation engineer.
- Golf instructor or biomechanics advisor.
- Privacy or legal reviewer.

A small team may combine roles, but camera, mobile ML, golf-domain validation, and store-release responsibilities must have clear owners.

---

# 18. Definition of Done

A feature is done only when:

- Requirements are documented.
- UX is reviewed.
- Accessibility is reviewed.
- TypeScript and native implementation are complete.
- Unit tests pass.
- Integration tests pass.
- Physical-device tests pass.
- Performance is measured.
- Privacy impact is reviewed.
- Error handling exists.
- Analytics or diagnostics are privacy-safe.
- Documentation is updated.
- Release notes are written.
- Product owner accepts behavior.
- Golf-domain reviewer approves feedback-related behavior.

---

# 19. Major Risks and Mitigations

## Risk 1: Pose estimates appear more precise than they are

**Mitigation**

- Show confidence.
- Identify camera view.
- Label two-dimensional estimates.
- Suppress low-confidence feedback.
- Validate against instructor-labeled data.

## Risk 2: Ball tracking does not work reliably

**Mitigation**

- Treat it as experimental.
- Separate detection from full-flight claims.
- Require high-frame-rate recording.
- Provide manual trajectory tools.
- Support external launch-monitor data later.

## Risk 3: Simultaneous front and rear camera is inconsistent

**Mitigation**

- Runtime capability checks.
- Supported-device list.
- Graceful single-camera fallback.
- Device-specific testing.
- Do not make dual camera necessary for core use.

## Risk 4: React Native bridge creates latency

**Mitigation**

- Process frames natively.
- Transfer compact landmarks rather than images.
- Use TurboModules, JSI, or another optimized native interface.
- Render overlays using an optimized graphics path.
- Profile before adding abstractions.

## Risk 5: Feedback is incorrect or overly generic

**Mitigation**

- Instructor-reviewed rule library.
- Confidence thresholds.
- Camera-specific rules.
- Limited feedback count.
- User feedback mechanism.
- Versioned analysis rules.

## Risk 6: Local-only data is lost

**Mitigation**

- Explain local-only storage.
- Provide export.
- Add optional user-controlled encrypted backup later.
- Never imply automatic backup exists.

## Risk 7: Storage becomes excessive

**Mitigation**

- Storage dashboard.
- Configurable video quality.
- Optional source-video compression.
- Delete suggestions.
- Never delete a user swing without confirmation.

## Risk 8: Privacy SDK leakage

**Mitigation**

- Minimize third-party SDKs.
- Review data behavior.
- Maintain SDK inventory.
- Disable session replay.
- Block video and landmark information from telemetry.

---

# 23. Final Implementation Directive

The engineering team should begin with three technical proofs of concept before full application development:

### Proof of concept A: Camera

- Record stable 60 FPS video.
- Support front and rear camera selection.
- Save locally.
- Replay frame by frame.
- Test app interruptions.
- Detect simultaneous-camera support.

### Proof of concept B: Pose

- Process recorded golf swings locally.
- Draw landmarks.
- Calculate hip, shoulder, knee, elbow, and spine measurements.
- Benchmark latency and accuracy on representative devices.
- Detect low-confidence conditions.

### Proof of concept C: Golf analysis

- Detect address, top, estimated impact, and finish.
- Compare two swings.
- Generate one instructor-approved feedback item.
- Save analysis and replay it without a network connection.

Full production development should proceed only after these proofs demonstrate acceptable accuracy, device performance, storage behavior, and user comprehension.
