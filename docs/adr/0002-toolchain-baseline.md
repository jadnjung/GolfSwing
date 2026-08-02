# 0002. Toolchain baseline

- Status: Accepted, pending re-confirmation at app-scaffold time
- Date: 2026-08-02

## Context

The project is a bare (non-Expo) React Native + TypeScript monorepo with native Swift/Kotlin modules for camera capture and ML inference (see PRD sections 7.3, 7.4, 11). Every other pinned version — Node, pnpm, JDK, Xcode, Ruby, Android SDK — is downstream of which React Native release we target, so that has to be decided first, even though the app itself is scaffolded in a later step.

We deliberately did **not** pin tooling to whatever happened to already be installed on the first developer machine used to set this repo up (Node 20.18.0, Java 23, system Ruby 2.6.10) — none of those were chosen for a reason, they were just already present.

## Decision

Target baseline, to be re-verified against the actual latest patch/state of each tool immediately before Step 2 (app scaffolding):

| Component                  | Required      | Team-pinned                                      | Locally installed (this dev machine) | Verification status                                        |
| -------------------------- | ------------- | ------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| React Native               | 0.81.x        | TBD exact patch                                  | No                                   | PENDING — confirm latest 0.81.x patch at scaffold time     |
| Node.js                    | 22 LTS        | 22.23.2                                          | Yes, via fnm                         | Verified 2026-08-02                                        |
| pnpm                       | 10.x          | 10.34.5 (see `packageManager` in `package.json`) | Yes, via corepack                    | Verified 2026-08-02                                        |
| JDK                        | 17            | 17                                               | No (23 present, not used)            | PENDING                                                    |
| Xcode                      | >= 16.1       | TBD                                              | No                                   | PENDING — manual App Store install required                |
| Ruby                       | 3.3.x         | 3.3.12                                           | Yes, via rbenv                       | Verified 2026-08-02                                        |
| CocoaPods                  | TBD, deferred | —                                                | No                                   | Deferred to Step 2                                         |
| Fastlane                   | TBD, deferred | —                                                | No                                   | Deferred to Step 2                                         |
| Android compile/target SDK | TBD           | —                                                | —                                    | PENDING — set during Step 2 against RN 0.81 support matrix |
| Watchman                   | latest stable | 2026.07.27.00                                    | Yes, via Homebrew                    | Verified 2026-08-02                                        |

## Consequences

- `.nvmrc`, `.tool-versions`, `.ruby-version`, and `package.json` (`packageManager`, `engines`) encode this baseline, not the machine's current state.
- Step 2 (app scaffolding) must re-check that React Native 0.81 is still the right target before running `npx react-native init` — if a newer stable release exists by then, this ADR should be superseded rather than silently ignored.
- Until Xcode and Android Studio are installed, `scripts/doctor.sh` (see Step 1 tooling) will correctly report them as `MISSING`, not fail the whole check.
- CocoaPods and Fastlane are intentionally not pinned yet — see `docs/adr/0003-defer-cocoapods-fastlane.md` would be added if that reasoning needs its own record; for now it's captured here since it's a direct consequence of the RN version decision.
