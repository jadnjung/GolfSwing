# 0004. Camera capture library: react-native-vision-camera 4.7.3

- Status: Accepted
- Date: 2026-08-03

## Context

Phase 1 (Recording Foundation) needs real camera capture in `apps/mobile`. Three paths exist:

1. Hand-written custom native modules (`native/ios-swing-capture`, `native/android-swing-capture`, scaffolded as placeholders in Step 1) — direct AVFoundation/CameraX code.
2. `react-native-vision-camera` 5.2.1 (`@latest` at time of writing) — a Nitro-Modules-based rewrite with a much larger API (sessions, output configs, gesture controllers, depth/object-detection outputs). Mandatory peers: `react-native-nitro-modules`, `react-native-nitro-image`.
3. `react-native-vision-camera` 4.7.3 (latest 4.x, 29 releases since 4.0.0) — the classic, widely-documented API. Peers `react-native-reanimated`, `@shopify/react-native-skia`, `react-native-worklets-core` are all optional, needed only for frame processors.

This environment has no Xcode or Android Studio installed, so none of these three options can be compiled or run here — the decision has to be made on documentation, peer-dependency footprint, and maturity, not a working build.

## Decision

Use **`react-native-vision-camera` 4.7.3**, not option 1 or option 2.

- Not hand-written native modules: would mean reimplementing AVFoundation/CameraX capture from scratch, entirely unverified in this environment, duplicating what a mature library already does. PRD section 7.3 already calls for native frame handling without crossing the JS bridge — vision-camera's frame processor API (available when we add the optional peers in Phase 2) is built for exactly this, so hand-rolling gains nothing here.
- Not 5.2.1: bigger, newer, less proven API surface (recently out of beta), mandatory Nitro Modules dependency adding another unverified native layer, and far less community/GitHub-issue track record to lean on when something breaks — which matters more, not less, given nothing here can be compile-checked.
- 4.7.3: extensively documented, huge install base, simple API (`<Camera device={device} isActive photo video />`, static `Camera.requestCameraPermission()` etc.), and its advanced-feature peers (reanimated, skia, worklets-core) are optional — so adding it now for plain photo/video capture doesn't drag in any of them before they're actually needed.

This mirrors the reasoning in ADR 0003 (React Native 0.81.6 over `@latest` 0.86.2): prefer the more proven, narrower-risk option, especially when the result can't be compile-verified in this environment.

## Consequences

- `native/ios-swing-capture` and `native/android-swing-capture` READMEs are updated: their purpose is now future custom **frame-processor plugins** (e.g. the pose-inference bridge, Phase 2) that plug into vision-camera's frame processor API, not full camera capture reimplementation.
- Frame processors, and their optional peers (`react-native-reanimated` 3.x per ADR 0003's reasoning, `@shopify/react-native-skia`, `react-native-worklets-core`), are added only when Phase 2 (pose inference) actually needs them.
- Camera capture and permission code added in this step (`RecordScreen.tsx`, `recordingSetupStore.ts`) is typecheck/lint/test-verified via a manual Jest mock (vision-camera ships none), but **not build-verified** — first real verification happens once Xcode/Android Studio are installed and this runs on an actual device/simulator.
- If Phase 2's pose-inference needs later turn out to require Nitro-specific capabilities that 4.x can't provide, revisit via a new ADR rather than silently upgrading in place.
