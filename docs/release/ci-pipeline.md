# CI/CD pipeline status

Tracks what's actually implemented in `.github/workflows/` versus what the PRD (section 12.3) eventually calls for, so it's clear what's real and what's aspirational.

## Implemented

- `pr-checks.yml`: checkout, Node setup from `.nvmrc`, pnpm via corepack (version-checked against `packageManager`), dependency install, lint, typecheck, `pnpm -w test` (exercises the real `tooling-smoke-test` package), `pnpm audit`, gitleaks secret scan.
- Dependency updates via Dependabot (`.github/dependabot.yml`), not a CI job.

## Not yet implemented (TODO, blocked on app/native modules existing)

- Android debug build.
- iOS simulator build.
- Native module tests (XCTest / Android instrumentation).
- Model-checksum manifest validation.
- Main-branch pipeline: signed internal artifacts, integration tests, physical-device tests, SBOM generation, symbol archiving, internal beta upload.
- Release pipeline: production AAB/IPA build, signing, TestFlight/Play internal track upload, staged rollout, smoke test, rollback triggers.
- GitHub Dependency Review — not assumed available on this repo/plan tier; revisit once the repo has a GitHub remote and confirmed feature access. Dependabot + `pnpm audit` cover the gap in the meantime.

## Notes

- All GitHub Actions in `pr-checks.yml` are pinned by full commit SHA, not floating tags, per supply-chain guidance in PRD section 12.4.
- No job silently "passes" without doing real work — the test step fails if `packages/tooling-smoke-test`'s Jest suite fails.
