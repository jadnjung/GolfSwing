# CLAUDE.md

# Golf Swing App Development Guidelines

You are the primary software engineering agent for this repository.

Your objective is to produce production-quality software that is maintainable, well-tested, and easy for future developers to understand.

---

# General Principles

- Think before making changes.
- Read relevant existing files before editing.
- Prefer modifying existing code over unnecessary rewrites.
- Make the smallest change that fully solves the problem.
- Never sacrifice maintainability for speed.
- Favor readability over cleverness.
- Explain assumptions when they are uncertain.
- If requirements conflict, stop and explain the conflict instead of guessing.

---

# Repository Scope

Only work inside this repository.

Never intentionally access, modify, or search files outside this project unless explicitly instructed.

Never use personal files on the computer.

---

# Development Philosophy

Follow these priorities:

1. Correctness
2. Reliability
3. Simplicity
4. Maintainability
5. Performance
6. Premature optimization (avoid)

Write code as if another engineer will maintain it for years.

---

# Before Starting Any Task

Always:

1. Read the user's request carefully.
2. Read any files necessary to understand the task.
3. Inspect the existing architecture before changing it.
4. Create a short implementation plan internally before writing code.

---

# Coding Standards

Write production-quality code.

Use:

- descriptive names
- small functions
- modular architecture
- consistent formatting
- strong typing
- minimal duplication

Avoid:

- unnecessary comments
- dead code
- temporary hacks
- TODOs unless requested
- duplicated logic
- unused dependencies

---

# Project Structure

Respect the existing architecture.

Do not reorganize folders unless requested.

Do not rename files unnecessarily.

---

# Dependencies

Before adding any dependency:

- Prefer the standard library.
- Reuse existing dependencies.
- Add a new dependency only if it provides significant value.
- Keep versions explicitly pinned.

---

# Error Handling

Never silently ignore failures.

Provide meaningful errors.

Handle edge cases.

Fail safely.

---

# Testing

Whenever appropriate:

- update tests
- add tests for new behavior
- avoid breaking existing tests

Tests should verify behavior rather than implementation details.

---

# Validation

Before declaring a task complete:

Run all applicable validation.

Examples include:

- lint
- formatter
- typecheck
- unit tests
- integration tests
- build

Fix failures before considering the task complete.

---

# Git Workflow

One logical task equals one commit.

After every completed task:

1. Verify the repository status.
2. Run validation.
3. Fix issues.
4. Create a descriptive Git commit.
5. Push the commit to the configured remote branch.

Commit messages should clearly describe what changed.

Examples:

- Set up monorepo tooling
- Configure TypeScript project
- Add React Native camera module
- Implement pose estimation pipeline

Never create "WIP" commits unless explicitly requested.

Never rewrite Git history.

Never force push.

Before pushing, verify that the commit was created successfully and that the current branch is tracking the correct remote branch.

If the push fails, report the error clearly and do not use force push to resolve it.

---

# Safety

Never:

- expose secrets
- commit API keys
- commit credentials
- modify unrelated files
- delete large portions of code without reason

If a potentially destructive operation is required, explain why before proceeding.

## Protecting secret information

This app is local-only for its entire current scope (no backend, no required account, no network path exists yet) — there are no API keys, tokens, or credentials for it to need today. Keep it that way by default:

- Never hardcode an API key, token, password, or private certificate/key into source, config, or a commit — even a "temporary" one for local testing.
- Any credential a feature genuinely needs goes in an untracked `.env` file (already covered by `.gitignore`) or GitHub Actions secrets for CI — never committed, never logged, never printed to a terminal that gets pasted elsewhere.
- The one exception already in this repo: `apps/mobile/android/app/debug.keystore` is the React Native template's standard **debug**-only keystore with well-known, publicly documented default credentials (`androiddebugkey` / `android`) — this is normal to commit and share across a team. A **release** signing keystore or provisioning profile private key must never be committed, regardless of this exception.
- CI already runs a Gitleaks secret scan (`.github/workflows/pr-checks.yml`) on every PR — treat a failure there as a real finding to investigate, not something to bypass or silence.
- If a secret is ever accidentally committed, treat it as compromised the moment it's pushed — rotating/revoking it comes first. Deleting it in a later commit is not sufficient on its own, since it still exists in prior history; removing it from history is a separate, explicit decision (see Git Workflow's rules on never rewriting history without being asked).
- If and when a real cloud feature is eventually built (PRD section 7.10 — explicitly deferred, opt-in, not part of current scope), revisit this section rather than assuming the same "no secrets" posture still holds.

---

# Communication

When a task finishes, provide:

## Summary

- What changed
- Files modified
- Validation results
- Any assumptions
- Remaining work (if applicable)

Keep summaries concise.

---

# Decision Making

When multiple good solutions exist:

Choose the solution that is:

- simplest
- easiest to maintain
- most consistent with the existing codebase

Avoid unnecessary abstraction.

---

# Performance

Optimize only when justified.

Prioritize correctness before optimization.

---

# Documentation

When introducing important architecture or developer workflows:

Update the relevant documentation.

Avoid documenting obvious code.

---

# Code Quality Checklist

Before finishing, verify:

- Code compiles
- Tests pass
- Lint passes
- Formatting passes
- No unnecessary files created
- No debug code remains
- No commented-out code remains
- No unused imports remain

---

# Golf Swing App Expectations

This project is intended to become a production mobile application.

Favor scalable architecture over quick prototypes.

Prefer reusable components.

Keep business logic separate from UI.

Design with future AI, camera, pose estimation, and cloud synchronization in mind.

Avoid shortcuts that would make future expansion difficult.

---

# Final Rule

Do not consider a task complete until:

- the implementation is finished,
- validation succeeds,
- changes are summarized,
- and a Git commit has been created.
