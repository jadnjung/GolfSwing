# 0008. Crash handling: local error boundary + diagnostic log, defer external SDK

- Status: Accepted
- Date: 2026-08-03

## Context

Checklist's last unchecked Phase 1 (Recording Foundation) deliverable is "Crash handling." PRD section 14.1 calls for "a privacy-reviewed crash-reporting SDK or a native store diagnostic system"; section 6.3 asks the app to recover from a list of failure conditions (camera interruption, backgrounding, low storage, corrupted local record, model initialization failure, etc.) rather than crashing outright; section 14.2 asks for a short rotating local diagnostic log with a user-triggered support-package export.

Picking and wiring in an actual crash-reporting SDK (Sentry, Bugsnag, or the platform's own diagnostics system) means creating a real vendor account, generating a real DSN/API key, and reviewing that vendor's own data-handling practices against PRD section 9 (Security and Privacy) before it ships — none of which can be done responsibly from inside this environment. Faking a placeholder DSN would produce something that looks configured but silently fails or, worse, gets left in place and mistaken for real coverage.

## Decision

Split the deliverable:

1. **Build now, without an external dependency:**
   - A React `ErrorBoundary` (`apps/mobile/src/diagnostics/ErrorBoundary.tsx`) wrapping the navigation tree in `App.tsx`, so a render-time error in one screen shows a recoverable "Something went wrong" fallback instead of white-screening the whole app.
   - A global JS error handler (`installGlobalErrorHandler.ts`) wrapping React Native's own `ErrorUtils.setGlobalHandler`, catching fatal errors thrown outside React's render tree (async callbacks, event handlers) that an `ErrorBoundary` cannot see.
   - A rotating local diagnostic log (`diagnosticLog.ts`, `<DocumentDirectoryPath>/logs/diagnostics.log`, capped at 500 entries) that both of the above write to — satisfying PRD 14.2's "short rotating local log," entirely on-device, no network call.
   - Both log paths pass only an error's `message` and `stack` — never the video, pose data, or user notes that section 14.1 explicitly excludes from crash telemetry, and there's nothing to "not upload" in the first place since none of this leaves the device (ADR-002, on-device-first architecture).

2. **Explicitly deferred to Phase 6 (Commercial Launch):**
   - Selecting and integrating an actual crash-reporting SDK or native store diagnostic system (PRD 14.1).
   - The user-facing "generate a support package" flow (PRD 14.2) that shares the diagnostic log via the OS share sheet — needs a Settings-screen entry point that doesn't exist yet.
   - Operational metrics aggregation (PRD 14.3).

## Consequences

- The app no longer white-screens on an uncaught render error or fatal async error; both are caught, logged locally, and (for render errors) recoverable via a retry button.
- `Checklist.md`'s "Crash handling" line is checked as done for what Phase 1 actually needs (not crashing outright, logging privacy-safely); the Phase 6 items above stay unchecked and are now explicitly named here rather than implied by the Phase 1 checkbox.
- Typecheck/lint/test-verified (a manual `global.ErrorUtils` stand-in in `installGlobalErrorHandler.test.ts`, since RN's Jest preset doesn't install one), but **not build-verified** — same caveat as every native-adjacent decision since Step 1.
- If Phase 6 picks an SDK whose own instrumentation would conflict with or duplicate this local logging (e.g. it wants to own the global error handler too), revisit via a new ADR rather than silently layering both.
