# Toolchain

This mirrors the decision table in `docs/adr/0002-toolchain-baseline.md`. If they ever disagree, the ADR is the record of _why_; this file is the living reference — update both together.

| Component                  | Required      | Team-pinned     | Locally installed | Verification status                                           |
| -------------------------- | ------------- | --------------- | ----------------- | ------------------------------------------------------------- |
| React Native               | 0.81.x        | TBD exact patch | No                | PENDING — confirm latest 0.81.x patch at Step 2 scaffold time |
| Node.js                    | 22 LTS        | 22.23.2         | Yes (fnm)         | OK                                                            |
| pnpm                       | 10.x          | 10.34.5         | Yes (corepack)    | OK                                                            |
| JDK                        | 17            | 17              | No                | PENDING — manual install                                      |
| Xcode                      | >= 16.1       | TBD             | No                | PENDING — manual App Store install                            |
| Ruby                       | 3.3.x         | 3.3.12          | Yes (rbenv)       | OK                                                            |
| CocoaPods                  | TBD           | —               | No                | Deferred to app scaffolding                                   |
| Fastlane                   | TBD           | —               | No                | Deferred to app scaffolding                                   |
| Android compile/target SDK | TBD           | —               | —                 | PENDING — set during app scaffolding                          |
| Watchman                   | latest stable | 2026.07.27.00   | Yes (Homebrew)    | OK                                                            |
| Git                        | any recent    | —               | 2.39.5 (observed) | OK                                                            |

Run `scripts/doctor.sh` to get a live read of what's actually installed on a given machine versus this table. Update the "Locally installed" / "Verification status" columns here (not in the ADR) as machines get provisioned — the ADR records the decision, this file tracks state.
