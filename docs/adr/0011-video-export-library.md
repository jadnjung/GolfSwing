# 0011. Local video export library: react-native-share 12.3.1

- Status: Accepted
- Date: 2026-08-03

## Context

MVP item 22 (PRD 3.1) needs local export of a saved swing's video via the OS share sheet — the natural way to get a file off-device (AirDrop, Messages, save to Files/Photos, etc.) without this app needing its own upload/cloud infrastructure (ADR-002, on-device-first). PRD 9.3 already assumes an explicit user-initiated export path exists ("Do not save recordings to the public camera roll unless the user explicitly exports them").

Core React Native ships a `Share` API (`Share.share({ url })`), but it has a real, well-documented platform gap: on iOS, `url` works fine for local `file://` paths. On Android, `Share.share()` only supports sharing plain text — passing a local file URI directly into an `ACTION_SEND` intent throws `FileUriExposedException` on API 24+ (Android's StrictMode blocks exposing raw `file://` paths to other apps); Android requires a `content://` URI backed by a `FileProvider`, which core RN's `Share` module does not set up.

Checked the realistic paths to close that gap:

- **`react-native-share`** — the standard community library for exactly this problem. Latest 12.3.1, actively maintained (most recent release 2026-05-04, 12.x line with many prior releases), no narrow peer-version constraint (doesn't declare a `react-native` peer range that would conflict with this project's 0.81.6 pin, unlike the `react-native-screens` situation in ADR 0010). Its own bundled `AndroidManifest.xml` registers a `FileProvider` (`RNShareFileProvider`) that Gradle's manifest merger picks up automatically — no manual per-project FileProvider XML/paths configuration needed in this app.
- Hand-configuring a `FileProvider` ourselves (an `AndroidManifest.xml` `<provider>` entry, a `file_paths.xml` resource, and using `androidx.core.content.FileProvider.getUriForFile` from a small native module) — real native Android work for a solved problem, the same objection as ADR 0004/0005/0007's reasoning against hand-rolling what a maintained library already does correctly.

## Decision

Use **`react-native-share` 12.3.1** for local export, called from `ReplayScreen`. `Share.open({ url: 'file://<path>', type: 'video/mp4', filename: 'swing-<id>' })` — the library handles the iOS/Android URI difference internally.

Scope: export the **raw source video only**, not an "annotated" export. PRD's "annotated video" (skeleton/angle overlays baked into an exported clip) needs pose data and a rendering pipeline that don't exist until Phase 2 — exporting the source video now is honest about what's actually available, and the export call site doesn't change when overlay rendering is added later (only what gets passed as the file path would, if a separate annotated file is produced).

## Consequences

- `ReplayScreen` gains an "Export" button that opens the OS share sheet for the swing's `source.mp4`.
- The user cancelling the share sheet is not an error — `Share.open`'s promise rejects in that case (with a message indicating dismissal), and this is treated as a normal outcome, not surfaced as a failure alert. A genuine failure (e.g. no app available to handle the file type) does surface an alert.
- Typecheck/lint/test-verified via a manual Jest mock (ships none), but **not build-verified** — same caveat as every native-adjacent decision since Step 1. The Android `FileProvider` behavior specifically cannot be verified without a real device/emulator run through an actual share target.
- If Phase 2 adds a genuinely "annotated" export (overlay-rendered clip), revisit whether `react-native-share`'s API still fits (it should — it's file-path-agnostic) rather than assuming a new library is needed.
