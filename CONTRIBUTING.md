# Contributing

This repository is not currently open to external contributions. This document covers internal workflow.

## Getting started

See the root `README.md` for prerequisite tooling and setup, and `scripts/doctor.sh` to verify your machine matches the pinned toolchain in `docs/adr/0002-toolchain-baseline.md`.

## Workflow

- Trunk-based development against `main`, with short-lived feature branches (PRD section 12.1).
- `main` is protected; all changes land via pull request.
- Required PR checks: lint, typecheck, unit tests, secret scan (see `.github/workflows/pr-checks.yml`).
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
- Architectural decisions (framework, storage, native module boundaries, toolchain versions) get an ADR in `docs/adr/` — see `docs/adr/0001-record-architecture-decisions.md`.

## Code style

- TypeScript strict mode; do not weaken `tsconfig.base.json` per-package without a documented reason.
- Lint/format are enforced in CI (`pnpm lint`, `pnpm format`).
- No native dependency (camera, ML runtime, billing) upgrades are auto-merged — see PRD section 12.6.
