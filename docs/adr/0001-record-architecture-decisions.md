# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-08-02

## Context

The project will make a series of consequential, hard-to-reverse technical decisions (framework choice, native module boundaries, storage engine, toolchain versions) before much code exists. Decisions made in chat or in a PRD document tend to get lost or re-litigated once the reasoning behind them is forgotten.

## Decision

We will use Architecture Decision Records (ADRs), stored in `docs/adr/`, one file per decision, numbered sequentially. Each ADR records the context, the decision, and the consequences at the time it was made. Superseding a decision means adding a new ADR that references the old one, not editing history.

## Consequences

- Every future PR that changes a load-bearing architectural choice should add or update an ADR.
- ADRs are not updated after the fact to look retroactively correct — if a decision was wrong, a new ADR supersedes it.
