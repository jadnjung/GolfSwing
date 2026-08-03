# 0007. Video playback library: react-native-video 6.19.2

- Status: Accepted
- Date: 2026-08-03

## Context

Step 6 (Replay) needs to play back a swing's saved `source.mp4` (PRD section 5.10: play, pause, scrubber, at minimum). Core React Native has no video-playback component. Checked the realistic options:

- **`react-native-video`** — the long-standing, widely-used library for this (AVPlayer on iOS, ExoPlayer on Android). Latest is 6.19.2, actively maintained (most recent release 2026-07-07), 66+ published 6.x versions. Broad peer compatibility (`react: '*'`, `react-native: '*'`) — no narrow version window to work around, unlike the reanimated 4.x constraint hit in ADR 0003.
- Hand-written native wrapper around `AVPlayer`/`ExoPlayer` — same objection as ADR 0004 for camera capture: reimplements what a mature, widely-deployed library already does, entirely unverified in an environment with no Xcode/Android Studio to compile against anyway.
- `expo-video` — tied to the Expo module ecosystem; ADR (PRD section 7.4) already rejected a managed-Expo dependency for core native functionality.

## Decision

Use **`react-native-video` 6.19.2**. Same reasoning pattern as ADR 0004/0005: prefer the option with the largest real-world track record and no unusual peer constraints, since nothing here is compile-verifiable in this environment.

`<Video controls>` provides play/pause/scrubber out of the box, covering PRD 5.10's baseline playback requirements. Slow-motion speed control, frame-by-frame scrubbing, and skeleton/angle overlays (PRD 5.10, MVP items 17-18) are explicitly out of scope for this step — they depend on pose data that doesn't exist yet (Phase 2) and can be layered on top of this same `<Video>` component later (e.g. via its `rate` prop and a custom scrub UI) without a new playback library.

## Consequences

- Local swing videos play via `<Video source={{ uri: 'file://<path>' }} controls />` in `ReplayScreen.tsx`, reading the path from `swingRepository.swingVideoPath(swingId)` (same `<DocumentDirectoryPath>/swings/<id>/source.mp4` layout ADR 0005 established).
- Tapping a swing in `HistoryScreen` now pushes `ReplayScreen` via a new nested stack navigator (`HistoryStackNavigator`, using `@react-navigation/native-stack` — same major version, 7.18.6, as the already-installed `@react-navigation/native` 7.3.14) rather than the History tab staying a single flat screen.
- Playback is typecheck/lint/test-verified via a manual Jest mock (react-native-video ships none), but **not build-verified** — same caveat as every native-adjacent decision since Step 1.
- If Phase 3 (comparison playback, side-by-side, ghost overlay) needs capabilities this library can't provide, revisit via a new ADR rather than silently swapping.
