# 0009. Defer picking a pose-inference library

- Status: Accepted
- Date: 2026-08-03

## Context

Phase 2 (Pose Analysis MVP) starts with pose inference (`native/ios-pose-inference`, `native/android-pose-inference`). PRD section 5.2 names Google's MediaPipe ecosystem as "an appropriate initial candidate," but immediately qualifies it: "the implementation team must validate current iOS and Android task support before locking the production model." PRD section 16 (Phase 0 exit criteria) is explicit that this validation is a prerequisite, not optional: "reliable single-camera capture; pose inference works on representative iOS/Android devices... exit criteria — not yet met," and Phase 0's deliverables list "Pose-model benchmark" as still outstanding in `Checklist.md`.

Checked the realistic options for actually getting a pose model running from React Native:

- **`@mediapipe/tasks-vision`** — this is MediaPipe's _web/WASM_ package, meant for browser use. It has no native iOS/Android binding; using it in React Native would mean running a WASM pose model instead of MediaPipe's real native (Core ML / NNAPI-accelerated) task runtime, which defeats the point of on-device native inference PRD section 7.1 calls for.
- **`react-native-mediapipe`** (cdiddy77) — the one existing React Native wrapper around MediaPipe's native Tasks API, built on `react-native-vision-camera` frame processors (which this repo already uses, per ADR 0004). But its last release was **2024-12-12** — over 19 months stale relative to this project's timeline — across only 7 total releases, from a single maintainer, with no visible activity since. That maintenance profile is well below the bar every other native dependency in this repo has cleared (vision-camera, `@dr.pogodin/react-native-fs`, `react-native-video` — all chosen specifically for active, multi-release maintenance per ADRs 0004/0005/0007).
- Hand-written native modules calling Core ML / Vision (iOS) and NNAPI/TensorFlow Lite (Android) directly — the most control, but the largest amount of genuinely new native code in this project so far, entirely unverifiable without a working device build, and exactly the kind of decision Phase 0's "Pose-model benchmark" deliverable exists to de-risk _before_ committing.

## Decision

**Do not lock in a pose-inference library yet.** None of the three options clear this repo's established bar (proven track record, or a benchmarked reason to accept the risk), and PRD section 16 already gates this decision behind device-based validation this environment cannot perform (still no Xcode license accepted, no Android Studio installed — see the 2026-08-03 12:20 KST Progress.md entry).

Instead, build the part of Phase 2 that is fully specified, native-independent, and valuable regardless of which pose model eventually gets picked: PRD section 5.3's joint-angle formula, in `packages/analysis-engine`. It operates on plain `{x, y, confidence}` points — the same shape any pose model's 2D landmark output reduces to — so it doesn't need to know or care which library eventually produces those points.

## Consequences

- `packages/analysis-engine` now has real content: `calculateJointAngleDegrees`, matching PRD 5.3's formula exactly (three-point angle, cosine clamped to [-1, 1], landmarks below a confidence threshold rejected rather than silently used). Fully unit-tested, no React Native or native dependency at all.
- Pose inference itself, skeleton overlay, landmark smoothing, phase estimation, and the higher-level PRD 5.3 metrics (which need real landmark sequences, not just a three-point angle formula) all remain unbuilt until a pose-inference library is actually chosen.
- The next step toward unblocking that choice is real device access: getting the Xcode license accepted and Android Studio installed (both flagged as open items, both needing a human with `sudo`/interactive setup this agent doesn't have), then running an actual proof-of-concept per PRD section 23 ("Proof of concept B: Pose") against `react-native-mediapipe`, a hand-written native module, or whatever the landscape looks like by then — not silently defaulting to whichever option happens to compile first.
- Revisit via a new ADR once that validation is possible, rather than picking a library now and hoping it holds up unverified.
