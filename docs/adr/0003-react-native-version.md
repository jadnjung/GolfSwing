# 0003. React Native version: 0.81.6

- Status: Accepted
- Date: 2026-08-02
- Supersedes: the "PENDING — confirm latest 0.81.x patch" row in `docs/adr/0002-toolchain-baseline.md`

## Context

ADR 0002 assumed a React Native 0.81.x target but left the exact patch and the decision to re-confirm it as "PENDING" until app-scaffold time (Step 2). At scaffold time, the live npm registry showed `react-native@latest` = **0.86.2** — several minors ahead of the 0.81.x placeholder.

Picking the newest release isn't automatically correct for this app. Checking peer-dependency ranges for libraries this app will need later mattered more than "how new":

- `react-native-reanimated` (PRD section 7.3, needed for overlay/timeline UI) — the 4.x line (latest 4.5.3) declares `peerDependencies.react-native: "0.83 - 0.86"`. Pinning to 0.86.2 now would work today but lock reanimated 4.x's narrow range in from day one.
- Reanimated 3.x (latest 3.19.5, still maintained) has no RN version constraint at all — it works with 0.81.x just as well as 0.86.x.
- Camera/ML libraries this app also needs (`react-native-vision-camera`, `react-native-fast-tflite`) declare open (`"*"`) peer ranges, so they don't push the decision either way.

Given that, "newest stable" bought nothing here except less time in the wild, while creating a forced dependency (reanimated 4.x's narrow range) we don't need yet.

## Decision

Target **React Native 0.81.6** — a real, published patch of the version already assumed in ADR 0002, not the registry's `@latest`. Confirmed via npm registry:

- `react-native@0.81.6`: peer `react@^19.1.4`, engines `node: ">= 20.19.4"` (satisfied by our pinned Node 22.23.2).
- `@react-native-community/template@0.81.6` exists and matches.
- Android (from `packages/react-native/gradle/libs.versions.toml` at tag `v0.81.6`): `compileSdk = 36`, `targetSdk = 36`, `minSdk = 24`, `ndkVersion = 27.1.12297006`, Kotlin `2.1.20`.

When `react-native-reanimated` is actually added (not yet — no overlay/timeline UI exists), pin it to the 3.x line (latest 3.19.5), not 4.x, to stay compatible with this RN version.

## Consequences

- `docs/adr/0002-toolchain-baseline.md`'s React Native and Android SDK rows are updated to point here and marked resolved instead of PENDING.
- `apps/mobile` is generated from `@react-native-community/template@0.81.6` explicitly, not `@latest`.
- Revisit this pin (a new ADR, not silently bumping in place) if/when the app actually needs a reanimated 4.x feature badly enough to justify the RN 0.83+ upgrade.
