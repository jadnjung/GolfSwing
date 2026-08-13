# Golf Swing App

An on-device golf swing analysis mobile app (React Native + native Swift/Kotlin camera & ML modules). Records a swing, runs on-device pose detection, computes joint angles and swing phases, and gives beginner-friendly coaching feedback — with no required account and no video ever leaving the device by default.

Full spec: [`Project.md`](Project.md), [`Architecture.md`](Architecture.md), [`Decisions.md`](Decisions.md), [`Roadmap.md`](Roadmap.md).

## Start here (new to this project?)

Read these in order:

1. **[`CLAUDE.md`](CLAUDE.md)** — working agreement for AI-assisted development in this repo (git workflow, coding standards, validation requirements). Read this before making any change.
2. **[`Project.md`](Project.md)**, **[`Architecture.md`](Architecture.md)**, **[`Decisions.md`](Decisions.md)**, **[`Roadmap.md`](Roadmap.md)** — the full product/architecture/decisions/roadmap spec (split from the original combined PRD). Everything else in this repo traces back to it.
3. **[`Checklist.md`](Checklist.md)** — status at a glance: what's done, in progress, and not started, structured after the roadmap's delivery phases. Read this to see where the project stands _right now_.
4. **[`Progress.md`](Progress.md)** — chronological log of completed work, newest first, with the _why_ behind each decision. Read this to understand how we got here, not just where we are.
5. **[`docs/adr/`](docs/adr/)** — Architecture Decision Records for specific technical choices (toolchain versions, React Native version, etc.) and the reasoning behind them.

## Status

See `Checklist.md` for current status. As of this writing: tooling/environment setup is done; the React Native app shell (`apps/mobile`, navigation only, no camera/pose yet) is done. Native iOS/Android builds are not yet verified — that needs Xcode/Android Studio installed (see Prerequisites).

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
apps/mobile/     React Native app (0.81.6) — navigation shell only, no camera/pose yet
packages/        shared TypeScript packages (domain, analysis-engine, feedback-rules, ...)
native/          native iOS/Android camera + ML inference modules (not started)
models/          on-device ML model assets and manifests (not started)
scripts/         automation scripts (doctor.sh, etc.)
docs/            architecture, ADRs, privacy, release, QA docs
```

See `docs/adr/0002-toolchain-baseline.md` for the toolchain decisions and `docs/adr/0003-react-native-version.md` for why React Native 0.81.6 specifically.

## Working on `apps/mobile`

```bash
pnpm --filter @golf-swing/mobile run typecheck
pnpm --filter @golf-swing/mobile run lint
pnpm --filter @golf-swing/mobile run test
```

Native builds (`pnpm --filter @golf-swing/mobile run ios` / `run android`) require Xcode / Android Studio to be installed first — not yet verified in this environment.
