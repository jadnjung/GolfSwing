# 0005. Filesystem library: @dr.pogodin/react-native-fs

- Status: Accepted
- Date: 2026-08-03

## Context

`react-native-vision-camera`'s `startRecording`/`stopRecording` API writes video to a temporary path and hands it back via `onRecordingFinished(video)`. Turning that into stable local storage (PRD section 7.6: `ApplicationSupport/swings/<swing-id>/source.mp4`) needs real filesystem access — moving the file into a permanent per-swing directory and writing a JSON manifest alongside it. Core React Native provides no generic filesystem API.

Checked npm for the realistic options:

- **`react-native-fs`** (the original) — last published **May 2022**. Over four years with no release is a strong signal it's no longer actively maintained, which matters more, not less, given RN's New Architecture has moved significantly since then and none of this is compile-verifiable in this environment.
- **`@dr.pogodin/react-native-fs`** — an actively maintained fork of the same library, same API surface (drop-in replacement), latest release **2026-07-03** (weeks old at time of writing).
- **`react-native-blob-util`** — also actively maintained (last release 2026-06-19), but scoped more broadly around blob/network handling than the plain directory/file operations (`mkdir`, `moveFile`, `writeFile`) this app actually needs.

## Decision

Use **`@dr.pogodin/react-native-fs`**. Same reasoning pattern as ADR 0003 (React Native version) and ADR 0004 (camera library): prefer the option with the most real-world track record, but not at the cost of picking something abandoned — the original `react-native-fs` API has years of production usage across the RN ecosystem, and this fork keeps that same API current.

Storage root: `RNFS.DocumentDirectoryPath` on both iOS and Android (not iOS-only `LibraryDirectoryPath`), so one path-construction helper works cross-platform. This directory is private by default on both platforms (not exposed via iOS Files app or Android external storage unless the app explicitly opts in, which it doesn't) — consistent with PRD section 9.3 ("exclude swing files from unapproved shared storage").

## Consequences

- Swing videos and their manifests live under `<DocumentDirectoryPath>/swings/<swing-id>/`.
- File-move/write operations added in this step are typecheck/lint/test-verified via a manual Jest mock, but **not build-verified** — same caveat as every native-adjacent decision since Step 1 (still no Xcode/Android Studio in this environment).
- If a future need (e.g. background transfer, network blob handling) outgrows this library's scope, revisit via a new ADR rather than silently swapping.
