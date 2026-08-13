# Accepted Technical and Architectural Decisions

This document is the decisions reference described in `CLAUDE.md`'s "Project Documentation" section.

The authoritative, actively maintained decision log is `docs/adr/0001`–`0015` (see `Checklist.md`'s "Foundational / DevOps" section). Consult that log first for any decision made after the original PRD.

The section below is preserved from the original combined PRD (`docs/PRD.md`, now `Project.md`) for historical context — these were the initial architecture decisions made before the per-decision ADR process in `docs/adr/` began.

---

# 20. Key Architecture Decisions

## ADR-001: React Native with native camera and ML modules

**Decision:** Use React Native and TypeScript for shared UI and business logic. Use Swift and Kotlin for high-performance camera, inference, and encoding.

## ADR-002: On-device-first architecture

**Decision:** No required backend for recording, pose analysis, history, feedback, or training plans.

## ADR-003: Single camera is the guaranteed core mode

**Decision:** Front or rear camera selection is universally targeted. Concurrent front/rear capture is optional and capability-dependent.

## ADR-004: SQLite plus filesystem

**Decision:** Structured data resides in SQLite. Video and large analysis assets reside in application-private files.

## ADR-005: Rule-based coaching before generative coaching

**Decision:** Initial feedback and training plans use validated, versioned rules. Generative explanations may be considered later but cannot override measurement confidence or approved coaching logic.

## ADR-006: Ball tracking is experimental

**Decision:** The application will not claim launch-monitor accuracy without validated calibrated capture or external sensor data.

---
