# CLAUDE.md

# Golf Swing App Development Guidelines

You are the primary software engineering agent for this repository.

Your objective is to produce production-quality software that is maintainable,
well-tested, secure, performant, and easy for future developers to understand.

---

# General Principles

- Think before making changes.
- Read relevant existing files before editing.
- Prefer modifying existing code over unnecessary rewrites.
- Make the smallest change that fully solves the problem.
- Never sacrifice maintainability for speed.
- Favor readability over cleverness.
- Explain assumptions when they are uncertain.
- If requirements conflict, explain the conflict instead of guessing.
- Do not perform unrelated refactors while completing a task.
- Preserve existing behavior unless the task intentionally changes it.

---

# Repository Scope

Only work inside this repository.

Never intentionally access, modify, or search files outside this project unless
explicitly instructed.

Never use personal files on the computer.

Never edit, commit, or push changes to this file (`CLAUDE.md`) unless the user
explicitly says so in that conversation.

Permission to modify related documentation, configuration, or the project in
general does not imply permission to modify `CLAUDE.md`.

---

# Project Documentation

Before substantial changes, consult the available project documentation.

When present, use:

- `Project.md` — product purpose, requirements, scope, and constraints
- `Architecture.md` — technical architecture and module boundaries
- `Decisions.md` — accepted technical and architectural decisions
- `Roadmap.md` — planned development phases and priorities

Do not assume the contents of a documentation file that does not exist.

When documentation and implementation appear inconsistent:

1. Investigate the discrepancy.
2. Determine whether the implementation or documentation is outdated.
3. Do not silently choose one.
4. Report meaningful conflicts when they affect the requested work.

Do not silently override accepted decisions documented in `Decisions.md`.

---

# Development Philosophy

Follow these priorities:

1. Correctness
2. Reliability
3. Simplicity
4. Maintainability
5. Security
6. Performance
7. Premature optimization — avoid

Write code as if another engineer will maintain it for years.

---

# Before Starting Any Task

Always:

1. Read the user's request carefully.
2. Check repository status when code changes may be required.
3. Identify existing uncommitted changes.
4. Read files necessary to understand the task.
5. Inspect the relevant existing architecture.
6. Consult relevant project documentation when available.
7. Determine whether external documentation is required.
8. Create a short implementation plan internally before writing code.

For trivial changes, keep planning proportional to the task.

For substantial changes, determine:

- goal
- affected modules
- dependencies
- implementation approach
- risks
- tests
- validation required

---

# Scope Control

Implement only what is necessary for the current task.

Do not:

- refactor unrelated code
- rename unrelated files
- reorganize unrelated folders
- add speculative features
- upgrade dependencies during unrelated work
- replace working architecture merely because another approach is preferred
- create abstractions solely for hypothetical future use

If unrelated problems are discovered, mention them rather than fixing them unless
they block the requested task.

---

# Coding Standards

Write production-quality code.

Use:

- descriptive names
- small cohesive functions
- modular architecture
- consistent formatting
- strong typing
- minimal duplication
- explicit module boundaries
- clear ownership of state and behavior

Avoid:

- unnecessary comments
- dead code
- temporary hacks
- TODOs unless requested or genuinely necessary
- duplicated logic
- unused dependencies
- unnecessary abstraction
- giant components
- giant hooks
- catch-all utility modules

---

# TypeScript

Use strict TypeScript practices.

Avoid:

- `any`
- unsafe casts
- unnecessary type assertions
- duplicate domain models
- suppressing legitimate type errors

Prefer:

- inferred types where obvious
- explicit types at important boundaries
- discriminated unions where appropriate
- exhaustive handling
- readonly data when appropriate
- shared domain types where a single source of truth is appropriate

Never weaken typing merely to make compilation succeed.

---

# Project Structure

Respect the existing architecture.

Do not reorganize folders unless the change is justified by the requested work.

Do not rename files unnecessarily.

Keep business logic separate from presentation logic.

Keep platform-specific functionality behind clear boundaries where practical.

Avoid circular dependencies.

---

# React Native

This is a React Native mobile application.

Use React Native-specific APIs and patterns rather than treating the application
as a browser-based React application.

When relevant, follow the React Native skills installed for this repository.

Consider both iOS and Android unless a task is explicitly platform-specific.

Account for platform differences when they affect:

- permissions
- camera behavior
- media access
- file access
- navigation
- keyboard behavior
- safe areas
- gestures
- lifecycle behavior
- background behavior
- notifications
- native APIs

Do not assume behavior is identical between iOS and Android.

---

# Mobile UI and UX

For user-facing interfaces, consider:

- information hierarchy
- clear navigation
- consistent spacing
- typography
- touch target size
- safe areas
- keyboard interactions
- gestures
- screen-size variation
- accessibility
- loading states
- empty states
- error states
- disabled states
- offline states
- success states

Prefer usability and clarity over decorative complexity.

Do not redesign unrelated screens while implementing a feature.

Use reusable components where doing so meaningfully improves consistency and
maintainability.

---

# State Management

Use the smallest appropriate state scope.

Prefer:

1. local component state
2. lifted state
3. context where appropriate
4. shared application state only when genuinely shared

Keep distinct concepts separate where practical:

- local UI state
- application state
- server state
- persistent state

Do not move state into a global store simply because it might eventually be
shared.

Avoid multiple competing sources of truth.

---

# Native Functionality

Keep native functionality behind clear interfaces where practical.

Examples include:

- camera
- video
- media library
- permissions
- file storage
- sensors
- machine learning
- platform services

Do not scatter direct native API calls throughout presentation components.

Before changing native configuration, understand the implications for both iOS
and Android.

---

# External Libraries and Documentation

Before implementing functionality that depends on a third-party:

- library
- framework
- SDK
- API
- native package

Always:

1. Determine the version installed in this repository.
2. Inspect existing usage in the codebase.
3. Use Context7 or official documentation when behavior may be
   version-dependent.
4. Verify method names, configuration, arguments, and return values.
5. Match the implementation to the version actually installed.

Do not invent APIs.

Do not rely on remembered documentation when current documentation is available
and version differences may matter.

---

# Dependencies

Before adding any dependency:

1. Prefer functionality already available in the platform or existing
   dependencies.
2. Verify compatibility with the current React Native version and project
   architecture.
3. Verify that the dependency is actively maintained.
4. Consider security.
5. Consider bundle size.
6. Consider native build implications.
7. Consider iOS and Android compatibility.
8. Explain why the dependency is justified.

Add a new dependency only when it provides meaningful value.

Keep versions explicitly pinned when consistent with the repository's existing
dependency policy.

Do not replace existing dependencies merely because another package is more
familiar.

---

# Error Handling

Never silently ignore failures.

Do not:

- use empty catch blocks
- swallow exceptions
- convert failures into fake success
- expose sensitive internal details to users

Provide meaningful errors.

Handle relevant edge cases.

Fail safely.

Differentiate error types where useful, such as:

- validation
- permissions
- network
- authentication
- authorization
- storage
- media
- platform
- unexpected internal errors

User-facing errors should be understandable and actionable.

---

# Testing

Whenever appropriate:

- update existing tests
- add tests for new behavior
- add regression tests for bug fixes
- avoid breaking existing tests

Tests should verify behavior rather than implementation details.

Use the lowest appropriate testing level:

- unit tests for pure logic
- component tests for component behavior
- integration tests for interactions between modules
- mobile E2E tests for critical user workflows

Test meaningful:

- success cases
- failure cases
- edge cases
- regressions
- asynchronous behavior
- platform-specific behavior when relevant

For bug fixes, reproduce the bug with a failing test first when practical.

Do not:

- create meaningless tests purely for coverage
- heavily mock everything without justification
- weaken tests merely to make them pass
- delete legitimate tests because they fail after a change

---

# Validation

Before declaring a task complete, run all applicable validation.

Examples include:

- lint
- formatter checks
- typecheck
- unit tests
- integration tests
- build
- native build validation
- relevant E2E tests

Use the repository's existing validation commands when available.

Fix failures caused by the task before considering it complete.

Never claim validation succeeded unless it was actually executed successfully.

If validation cannot be run, clearly state what could not be run and why.

---

# Git Workflow

One logical task equals one commit.

After every completed logical task:

1. Verify repository status.
2. Review the complete relevant diff.
3. Run required validation.
4. Fix issues caused by the task.
5. Verify repository status again.
6. Stage only files belonging to the logical task.
7. Create a descriptive Git commit.
8. Verify that the commit was created successfully.
9. Verify that the current branch is tracking the intended remote branch.
10. Push the commit to the configured remote branch.

Commit messages should clearly describe what changed.

Examples:

- Set up monorepo tooling
- Configure TypeScript project
- Add React Native camera module
- Implement pose estimation pipeline
- Fix camera permission handling

Never create `WIP` commits unless explicitly requested.

Never rewrite Git history.

Never force push.

Never change Git remotes unless explicitly instructed.

Never include unrelated existing modifications in a task commit.

If the push fails:

1. Report the error clearly.
2. Investigate non-destructive causes when appropriate.
3. Do not use force push as a workaround.

---

# Protect Existing Work

Before editing, inspect repository status.

Identify uncommitted changes that existed before the current task.

Preserve unrelated user work.

Never use destructive commands against unrelated changes, including:

- `git reset --hard`
- `git clean`
- destructive `git checkout`
- destructive `git restore`

Do not stash, overwrite, revert, or delete unrelated changes without explicit
instruction.

If existing changes overlap with the requested task, work carefully around them
rather than assuming they may be discarded.

---

# Safety

Never:

- expose secrets
- commit API keys
- commit credentials
- modify unrelated files
- delete large portions of code without justification

If a potentially destructive operation is required, explain why before
proceeding.

---

# Protecting Secret Information

This app is local-only for its entire current scope: no backend, required
account, or network path exists yet.

There are no API keys, tokens, or credentials that the app should require
today.

Keep it that way by default.

- Never hardcode an API key, token, password, private certificate, or private
  key into source, configuration, or a commit, even temporarily.
- Any credential a future feature genuinely requires belongs in an untracked
  `.env` file, platform-appropriate secure configuration, or GitHub Actions
  secrets for CI.
- Never commit, log, or intentionally print credentials.
- `apps/mobile/android/app/debug.keystore` is the React Native template's
  standard debug-only keystore with publicly documented default credentials
  (`androiddebugkey` / `android`). It may remain committed as intended for
  development.
- A release signing keystore, release certificate private key, provisioning
  profile private key, or equivalent production signing credential must never
  be committed.
- CI runs a Gitleaks secret scan through
  `.github/workflows/pr-checks.yml`. Treat a failure as a real finding to
  investigate rather than something to bypass or silence.
- If a real secret is accidentally committed and pushed, treat it as
  compromised immediately. Rotation or revocation comes first.
- Removing a secret in a later commit does not remove it from Git history.
- Never rewrite repository history to remove a secret unless explicitly
  instructed.
- If cloud functionality is eventually implemented, revisit these security
  assumptions rather than assuming the current local-only model still applies.

---

# Security

Treat all external data as untrusted.

When applicable, consider:

- authentication
- authorization
- input validation
- data exposure
- file handling
- secure storage
- logging
- secrets
- permissions

Client-side checks are never sufficient authorization.

Sensitive credentials must use platform-appropriate secure storage if they are
ever introduced.

Do not store authentication secrets in generic application storage when secure
platform storage is required.

---

# Performance

Optimize when justified.

Prioritize correctness before optimization.

Avoid obvious mobile performance problems such as:

- unnecessary rerenders
- expensive work during render
- blocking the JavaScript thread
- unbounded lists
- unnecessary repeated network or storage calls
- unnecessarily large media
- repeated expensive frame processing
- memory leaks
- excessive native bridge interactions

Camera, video, image processing, pose estimation, animation, and ML code should
be treated as performance-sensitive.

Measure before performing major optimization work.

---

# Documentation

When introducing important:

- architecture
- dependencies
- setup requirements
- development workflows
- APIs
- technical decisions

update the relevant documentation.

When present:

- product or scope changes belong in `Project.md`
- architecture changes belong in `Architecture.md`
- important accepted technical decisions belong in `Decisions.md`
- roadmap changes belong in `Roadmap.md`

Do not document obvious code.

Do not modify `CLAUDE.md` unless explicitly instructed by the user.

---

# Communication

When a task finishes, provide:

## Summary

- What changed
- Files modified
- Validation results
- Commit created
- Push result
- Important assumptions
- Remaining work, if applicable

Keep summaries concise.

---

# Decision Making

When multiple good solutions exist, choose the solution that is:

1. consistent with existing requirements
2. consistent with existing architecture
3. simplest
4. easiest to maintain
5. easiest to test
6. least likely to create unnecessary future complexity

Avoid unnecessary abstraction.

---

# Code Quality Checklist

Before finishing, verify as applicable:

- Code compiles
- Types pass
- Tests pass
- Lint passes
- Formatting passes
- Relevant builds pass
- No unnecessary files were created
- No temporary debug code remains
- No commented-out dead code remains
- No unused imports remain
- No unrelated files were modified
- No secrets were introduced
- Final diff was reviewed

---

# Golf Swing App Expectations

This project is intended to become a production mobile application.

Favor scalable architecture over quick prototypes.

Prefer reusable components where reuse is genuine.

Keep business logic separate from UI.

Design with future capabilities in mind, including:

- camera capture
- video processing
- pose estimation
- swing analysis
- AI-assisted features
- local persistence
- optional future cloud synchronization

However, do not build speculative infrastructure merely because these
capabilities may exist later.

Add architecture only when current requirements justify it.

Future scalability should influence boundaries and design decisions, not create
unused systems.

---

# Progress and Checklist Tracking

This repository uses two required project-tracking files:

* `Progress.md` — records the cumulative progress that has been completed in the project.
* `Checklist.md` — records the work being performed and whether each task is incomplete or complete.

Both files are part of the normal development workflow.

They must be kept synchronized with the actual repository state.

---

# Mandatory Tracking Workflow

For every logical task:

1. Read `Progress.md`.
2. Read `Checklist.md`.
3. Identify the checklist item or project work associated with the user's request.
4. Implement the requested task.
5. Add or update relevant tests.
6. Run applicable validation.
7. Review the resulting diff.
8. Update `Checklist.md`.
9. Update `Progress.md`.
10. Verify both files accurately reflect the completed work.
11. Stage the implementation and tracking-file changes together.
12. Create the logical-task commit.
13. Push the commit according to the repository Git workflow.

Updating `Progress.md` and `Checklist.md` is required before every completed-task commit.

Do not consider a logical task complete until both tracking files have been updated appropriately.

---

# Progress.md

`Progress.md` is the cumulative record of progress made throughout the project.

Every completed logical task must result in an appropriate update to `Progress.md`.

Record meaningful completed work such as:

* features implemented;
* bugs fixed;
* infrastructure completed;
* architecture implemented;
* integrations completed;
* tests added;
* important refactors;
* development milestones reached;
* project setup completed;
* meaningful technical work finished.

The purpose of `Progress.md` is to make it possible to understand what has already been accomplished without reconstructing the entire project from Git history.

Do not remove valid historical progress merely because newer work has been completed.

Keep previous completed progress unless it is:

* incorrect;
* duplicated;
* explicitly superseded;
* no longer useful because the project structure has fundamentally changed.

New completed work should normally be added to the existing progress record.

Do not claim work was completed unless it actually was.

Do not claim:

* tests passed;
* builds passed;
* lint passed;
* typechecking passed;
* validation passed;

unless those checks were actually executed successfully.

---

# Checklist.md

`Checklist.md` represents the tasks the project is currently working through.

Use standard Markdown task syntax:

* `[ ]` incomplete
* `[x]` complete

Every logical task should correspond to an existing checklist item when practical.

When a task is completed:

1. Locate the relevant checklist item.
2. Confirm the required implementation is actually complete.
3. Confirm applicable validation succeeded.
4. Change the item from `[ ]` to `[x]`.
5. Add concise context if necessary.

Example:

`[ ] Implement camera permission handling`

becomes:

`[x] Implement camera permission handling`

Do not mark an item complete merely because code was written.

A checklist item is complete only when the work required by that item is actually finished.

If a task is partially complete:

* leave the item as `[ ]`;
* add concise status information if useful;
* do not represent partial work as finished.

If the user's requested task is legitimate project work but no corresponding checklist item exists, add an appropriate checklist item and update its status based on the actual outcome.

---

# Relationship Between Progress.md and Checklist.md

The two files serve different purposes.

`Checklist.md` answers:

> What are we working on, and what is finished?

`Progress.md` answers:

> What progress has been made throughout the project?

When a task is completed:

* the relevant item in `Checklist.md` should be marked complete;
* the completed work should be recorded in `Progress.md`.

Both updates should happen as part of the same logical task.

Do not update only one file when both should reflect the completed task.

---

# Order of Operations

For a normal completed task, use this order:

1. Implement the task.
2. Add or update tests.
3. Run validation.
4. Fix legitimate failures.
5. Review the implementation.
6. Update `Checklist.md`.
7. Update `Progress.md`.
8. Review the final diff including the tracking files.
9. Stage only files belonging to the logical task.
10. Commit.
11. Push.

Do not commit the implementation first and update the tracking files in a separate follow-up commit.

The implementation, `Checklist.md` update, and `Progress.md` update should normally be part of the same commit.

---

# Commit Requirements

Before creating a logical-task commit, verify:

* the implementation is complete;
* applicable validation has succeeded;
* the appropriate `Checklist.md` item is marked correctly;
* `Progress.md` includes the completed work;
* neither tracking file contains inaccurate claims;
* unrelated checklist items were not changed;
* unrelated progress entries were not modified;
* only files related to the task are staged.

A normal completed task commit should therefore contain:

* the implementation;
* relevant tests;
* the `Checklist.md` update;
* the `Progress.md` update;
* relevant documentation changes when necessary.

---

# Push Requirements

After the logical-task commit is successfully created:

1. Verify the commit exists.
2. Verify the current branch is tracking the intended configured remote branch.
3. Push the commit.
4. Report the push result.

Do not force push if the push fails.

---

# Existing Tracking Information

Preserve existing valid information in both files.

Do not:

* rewrite `Progress.md` from scratch without reason;
* delete previous valid completed work;
* reset completed checklist items;
* reorder large sections unnecessarily;
* broadly reformat either file during unrelated work.

Only make the changes necessary to accurately reflect the current task.

---

# Source of Truth

The repository implementation is the source of truth for whether something actually exists.

The tracking files must describe the actual repository state.

If `Progress.md` or `Checklist.md` appears inconsistent with the code:

1. investigate the discrepancy;
2. determine what is actually implemented;
3. correct the tracking information when appropriate;
4. do not blindly trust stale tracking data.

Do not mark code as implemented simply because a tracking file says it is.

---

# Completion Rule

A logical task is not complete until:

* the requested implementation is finished;
* relevant validation has been performed successfully where applicable;
* the final implementation has been reviewed;
* `Checklist.md` accurately reflects the task's completion status;
* `Progress.md` records the completed progress;
* the final diff has been reviewed;
* a descriptive commit has been created;
* the commit has been pushed to the configured remote branch.

If either `Progress.md` or `Checklist.md` was not updated when the completed task requires it, the task is not complete.

---

# Final Rule

Do not consider a task complete until:

- the requested implementation is finished;
- relevant validation succeeds;
- the resulting diff has been reviewed;
- changes are summarized;
- a descriptive Git commit has been created;
- and the commit has been pushed to the configured remote branch.

If any required completion step cannot be performed, report that clearly rather
than claiming the task is complete.