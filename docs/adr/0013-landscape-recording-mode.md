# 0013. Landscape recording mode: react-native-orientation-locker 1.7.0

- Status: Accepted
- Date: 2026-08-03

## Context

MVP item 4 (PRD 3.1) and PRD 2.4's "primary orientation: portrait navigation and landscape swing recording" require the app to lock into landscape while `RecordScreen`'s camera is active, while every other screen stays portrait. Unlike the app's other native peer dependencies, this needs no player/decoder — just a way to force and release a UIKit/Android activity orientation lock from JS, which has no equivalent in React Native core or in `react-native-vision-camera`.

Checked the realistic options:

- **`react-native-orientation-locker`** (1.7.0, published 2024-04-20) — the long-standing default for this in the RN ecosystem. Declarative `<OrientationLocker orientation={LANDSCAPE} />` component (mount/unmount-scoped locking, no manual lock/unlock bookkeeping needed) plus an imperative API. Over two years since last publish at the time of writing — genuinely stale relative to every other dependency chosen so far this project (all under a year) — but still the most widely used, most thoroughly issue-tracked option for this specific need.
- **`react-native-orientation`** (3.1.3, published 2022-06-26) — older, less maintained, imperative-only API.
- **`expo-screen-orientation`** — requires the Expo module system as a peer; this project deliberately rejects managed Expo (PRD 7.4), the same reasoning that ruled out `@expo/vector-icons` in ADR 0012.
- **Hand-written native modules** — `native/ios-swing-capture` and `native/android-swing-capture` exist in this repo but were repurposed in ADR 0004 to future vision-camera frame-processor plugins, not general-purpose native modules; reimplementing orientation locking by hand here would duplicate a narrow, well-solved problem for no real gain, the same reasoning ADR 0004 used to reject hand-rolled camera capture.

## Decision

Use **`react-native-orientation-locker` 1.7.0**, accepting its staleness as a real but lesser risk than the alternatives (an Expo coupling, or a less-maintained/imperative-only competitor).

`RecordScreen.tsx` always renders `<OrientationLocker orientation={shouldLockLandscape ? LANDSCAPE : UNLOCK} />` rather than conditionally mounting/unmounting it. Two things forced this, both found through real build verification, not anticipated up front:

1. **Bottom-tab navigators keep inactive screens mounted by default.** A locker that only mounted inside the active-camera branch stayed mounted (and locked) even after switching to another tab, since `RecordScreen` itself never unmounts on tab change. Fixed by gating on `useIsFocused()` in addition to camera-readiness.
2. **This library's own stack-based unlock logic doesn't auto-unlock on the last unmount.** `OrientationLocker`'s internal `update()` (`node_modules/react-native-orientation-locker/src/OrientationLocker.js`) only calls `Orientation.unlockAllOrientations()` when some *other* mounted locker's stack entry explicitly requests `UNLOCK` — popping the last entry off an otherwise-empty stack does nothing. Simply unmounting the locker on blur (as the `useIsFocused()` fix alone did) left the lock in place forever after the first time the camera was ready. Fixed by never unmounting it at all: it always renders, toggling its `orientation` prop between `LANDSCAPE` and the library's own `UNLOCK` constant.

`shouldLockLandscape = isFocused && hasCameraAccess && device != null` — locked exactly while a swing could actually be recorded on this tab, unlocked the instant any of those three conditions stops holding.

### Native wiring required (per the library's own setup instructions)

- **iOS**: `AppDelegate.swift` needs `application(_:supportedInterfaceOrientationsFor:)` to return `Orientation.getOrientation()` — an Objective-C static call, which this project's Swift `AppDelegate` (RN 0.81's default template) has no bridging header for yet. Added `ios/GolfSwingMobile/GolfSwingMobile-Bridging-Header.h` (`#import "Orientation.h"`) and wired `SWIFT_OBJC_BRIDGING_HEADER` into both Debug and Release build configs in `project.pbxproj` — the first Swift/Obj-C interop this project has needed.
- **Android**: `MainActivity.kt` broadcasts `onConfigurationChanged` (the library listens for it, since `AndroidManifest.xml`'s existing `configChanges` for `orientation|screenSize|...` already keeps the activity from being recreated on rotation, so it needs an explicit signal instead). `MainApplication.kt` registers `OrientationActivityLifecycle` per the library's required setup.
- `Info.plist`'s `UISupportedInterfaceOrientations` already listed both landscape orientations (Step 2 scaffold) — no change needed there.

## Consequences

- `RecordScreen` now forces landscape while its camera preview/record controls are visible and this tab is focused; every other screen (including `Replay`/`Compare`/`History`) is unaffected.
- This is the first dependency in the project needing a Swift/Objective-C bridging header — future native modules with an Obj-C-only API can reuse `GolfSwingMobile-Bridging-Header.h` rather than each needing their own.
- **Android build-verified** (real emulator, `./gradlew assembleDebug` + install + screenshot): landscape lock engages on entering the Record tab with camera access granted, and releases back to portrait on switching to the Home tab — the exact bug described above (persistent lock across tab switches) was caught this way, not by inspection, and required the fix described in Decision.
- **iOS build-verified on real hardware** (a physical iPhone, not just a simulator): `pod install` + `xcodebuild` succeeded, and the app was installed and run on the device. The landscape lock and camera preview both confirmed working correctly when the phone is physically rotated to landscape to match the locked UI — initial confusion (the preview appeared tilted) turned out to be the user holding the phone in its natural portrait grip while the UI was landscape-locked, not a rotation bug; once the phone was turned to match, the preview rendered correctly. This is the first time any camera-facing feature in this app has been confirmed correct on real hardware, not just "builds and launches."
- **One real UX gap surfaced by this**: nothing in the UI currently tells the user to physically rotate their phone once the lock engages — a first-time user could reasonably be confused the same way, before realizing they need to turn the device. Worth a follow-up: a brief "rotate your phone" hint/overlay shown while the interface orientation doesn't match the physical device orientation.
- If `react-native-orientation-locker` goes fully unmaintained or breaks under a future RN/New Architecture upgrade, revisit via a new ADR — its staleness here was accepted as a known, documented risk, not an oversight.
