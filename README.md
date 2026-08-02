# Golf Swing App

An on-device golf swing analysis mobile app (React Native + native Swift/Kotlin camera & ML modules). Records a swing, runs on-device pose detection, computes joint angles and swing phases, and gives beginner-friendly coaching feedback — with no required account and no video ever leaving the device by default.

Full spec: [`docs/PRD.md`](docs/PRD.md).

## Status

Tooling/environment setup only. No app code yet — see `docs/adr/` for the decisions made so far and what's next.

## Prerequisites

| Tool                    | Required version | Notes                                                     |
| ----------------------- | ---------------- | --------------------------------------------------------- |
| Node.js                 | 22 LTS           | via nvm/fnm — see `.nvmrc`                                |
| pnpm                    | 10.x             | via corepack — see `packageManager` in `package.json`     |
| Ruby                    | 3.3.x            | via rbenv — see `.ruby-version`                           |
| Watchman                | latest stable    | `brew install watchman`                                   |
| Xcode                   | >= 16.1          | **manual install via the App Store — cannot be scripted** |
| Android Studio + JDK 17 | current stable   | manual install                                            |

Run `pnpm doctor` (wraps `scripts/doctor.sh`) to check what's actually installed on your machine against these pins. See `docs/release/toolchain-verification-checklist.md` for the full one-time verification walkthrough, and `docs/architecture/toolchain.md` for the live version table.

## Quick start

```bash
corepack enable
corepack use $(node -p "require('./package.json').packageManager")
pnpm install
pnpm doctor
pnpm lint
pnpm typecheck
pnpm test
```

## Repository layout

```
apps/            deployable apps (React Native app to be scaffolded)
packages/        shared TypeScript packages (domain, analysis-engine, feedback-rules, ...)
native/          native iOS/Android camera + ML inference modules
models/          on-device ML model assets and manifests
scripts/         automation scripts (doctor.sh, etc.)
docs/            architecture, ADRs, privacy, release, QA docs
```

See `docs/adr/0002-toolchain-baseline.md` for why specific versions were chosen.
