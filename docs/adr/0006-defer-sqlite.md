# 0006. Defer SQLite — filesystem-backed repository instead

- Status: Accepted
- Date: 2026-08-03

## Context

`packages/local-database`'s README (written in Step 1, before any real swing data existed) says "typed repository layer over the on-device SQLite database" per PRD section 7.5. Now that Step 4 actually writes swing data (`analysis-manifest.json` per swing under `<DocumentDirectoryPath>/swings/<uuid>/`), and Step 5 needs to read it back for a History screen, it's worth checking whether SQLite is actually warranted yet.

## Decision

**Not yet.** Build the swing repository as a filesystem scan (`readDir` the swings root, `readFile` + parse each manifest) instead of introducing a SQLite binding now.

Reasoning:

- The `analysis-manifest.json` per swing already _is_ the durable record. A SQLite database today would just be a second copy of the same data with nothing yet that needs it (no complex joins, no full-text search, no cross-swing aggregation).
- A personal local swing history is realistically hundreds of entries, not millions. Reading N small JSON files and filtering/sorting in JS is entirely adequate at this scale.
- SQLite means another native dependency (e.g. `@op-engineering/op-sqlite`, `react-native-sqlite-storage`) that can't be compile-verified in this environment (no Xcode/Android Studio) — not worth taking on for a scale/query problem that doesn't exist yet.

## Consequences

- `packages/local-database`'s README is updated to reflect this — not "not yet implemented" (implying SQLite is coming next), but explicitly deferred with this ADR as the reason.
- The swing repository lives in `apps/mobile/src/data/` (I/O/platform-specific), not `packages/local-database`, since there's no database layer to abstract yet — just filesystem calls. `packages/local-database` stays empty until an actual database is introduced.
- Revisit via a new ADR (not a silent swap) when PRD section 5.11's sort/filter/search requirements actually outgrow "read all manifests and filter in memory" — e.g. if swing count grows large enough that directory scanning becomes slow, or genuinely relational queries (joins across comparisons/training plans) are needed.
