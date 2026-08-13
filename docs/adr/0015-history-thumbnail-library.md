# 0015. History thumbnail library: react-native-create-thumbnail 2.2.0

- Status: Accepted
- Date: 2026-08-13

## Context

A UI/UX design review (this session) flagged `HistoryScreen`'s pure-text rows as a real usability gap, not just a cosmetic one: a swing history is inherently visual (it's video), and finding "that swing from yesterday" by reading club-type/date text alone, with no visual recall aid, is genuine friction. This needs extracting a static thumbnail frame from each swing's locally-saved `source.mp4`.

Checked the realistic options:

- **`react-native-video`** (already a dependency, ADR 0007) — no thumbnail/frame-extraction API at all; checked its source directly.
- **`react-native-create-thumbnail`** — a wrapper around `AVAssetImageGenerator` (iOS) / `MediaMetadataRetriever` (Android), purpose-built for exactly this. 305 GitHub stars, ~26,600 weekly npm downloads, MIT, latest 2.2.0 published 2025-11-29 (~8.5 months old at the time of writing — within this project's established "under a year" maintenance bar). No peer dependencies.
- **`react-native-media-toolkit`** — newer (Nitro/New-Architecture-native), but a much thinner track record (73 stars, solo maintainer, latest release only ~2 months old) — the same profile this project has repeatedly rejected elsewhere (e.g. ADR 0014 ruled out `react-native-mediapipe-posedetection` for "only 3 versions ever published, 23 commits, 26 stars"). Also requires `react-native-nitro-modules` as a peer dependency, not otherwise needed by this project, and its API surface (crop/trim/compress) is far broader than the single thumbnail-extraction need here.

## Decision

Use **`react-native-create-thumbnail` 2.2.0** — proven track record over newer/shinier, consistent with every other dependency choice this project has made (ADRs 0004, 0005, 0007, 0011, 0013).

**Real finding during integration, not anticipated up front**: the library's own bundled Android manifest unconditionally declares `WRITE_EXTERNAL_STORAGE` and `READ_EXTERNAL_STORAGE` — permissions for reading/writing external/shared storage (SD cards, legacy Android versions), which this app never actually needs, since every swing's video and its new thumbnail live in app-private storage (`DocumentDirectoryPath`), the same as everything else this app already reads/writes. Accepting those permissions silently would have expanded this privacy-focused app's permission footprint (PRD 9's privacy principle, and this project's `CLAUDE.md` secret/permission-minimalism posture) for something the actual feature doesn't need. Stripped both via Android's manifest-merger `tools:node="remove"` in `AndroidManifest.xml` — the resulting app manifest is unaffected by this library's permission requests, and the feature works purely against app-private file paths, which don't require them on Android regardless.

## Consequences

- `HistoryScreen`'s swing rows now show a real video-frame thumbnail instead of pure text — the highest-impact single fix from the UI/UX design review.
- Thumbnails are generated once per swing and cached alongside its other files (`thumbnail.jpg` next to `source.mp4` and `analysis-manifest.json`), not regenerated on every `HistoryScreen` visit.
- This is a new native dependency — **not build-verified** until the next real device/simulator rebuild (`pod install` + `xcodebuild`/`./gradlew`), consistent with how every other native addition this session has been labeled honestly until actually run on real hardware.
- If a future need for cropping/trimming/compressing swing video ever arises (none currently planned), that's a separate decision, not a reason to swap this library — its narrow scope here is a feature, not a limitation to work around preemptively.
