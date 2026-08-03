# Security Policy

This is a privacy-first, on-device application (see `docs/PRD.md` section 9). Swing video and pose data never leave the device by default, which shrinks but does not eliminate the attack surface — local storage encryption, permission handling, and dependency supply-chain hygiene still matter.

## Reporting a vulnerability

If you discover a security issue, please report it privately rather than opening a public issue. Contact: the repository owner (see `.github/CODEOWNERS`).

Please include:

- A description of the issue and its potential impact.
- Steps to reproduce.
- Affected version/commit.

We will acknowledge reports and work on a fix before any public disclosure.

## Scope

- App code in this repository (`apps/`, `packages/`, `native/`).
- Build and release pipeline (`.github/workflows/`, `scripts/`).

Out of scope until a backend exists: server-side infrastructure, since the MVP has no backend (PRD section 7.9).
