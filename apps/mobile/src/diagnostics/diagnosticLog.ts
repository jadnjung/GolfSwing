import {
  DocumentDirectoryPath,
  exists,
  mkdir,
  readFile,
  writeFile,
} from '@dr.pogodin/react-native-fs';

// PRD section 7.6 file layout reserves `logs/` for exactly this; section
// 14.2 calls for "a short rotating local log", not an unbounded one.
export const DIAGNOSTIC_LOG_PATH = `${DocumentDirectoryPath}/logs/diagnostics.log`;

const MAX_ENTRIES = 500;

export type DiagnosticLevel = 'error' | 'warn' | 'info';

export interface DiagnosticLogEntry {
  timestamp: string;
  level: DiagnosticLevel;
  message: string;
  stack?: string;
}

/**
 * Appends one entry to the local diagnostic log, dropping the oldest
 * entries once the log exceeds MAX_ENTRIES (append-only would grow
 * unbounded; PRD 14.2 wants a *short rotating* log).
 *
 * Deliberately excludes anything PRD 14.1 says crash/diagnostic data must
 * not include: no video, frames, pose data, notes, or swing file paths are
 * ever passed in by callers — see ErrorBoundary/installGlobalErrorHandler,
 * which only pass an error's message and stack trace.
 *
 * Failures to write the log are swallowed (after a console.warn) rather
 * than thrown: this function is called from error-handling paths, and a
 * broken diagnostic log must never mask or replace the original error.
 */
export async function appendDiagnosticLog(
  entry: Omit<DiagnosticLogEntry, 'timestamp'>,
): Promise<void> {
  try {
    const fullEntry: DiagnosticLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    await mkdir(`${DocumentDirectoryPath}/logs`);

    const existingEntries = (await exists(DIAGNOSTIC_LOG_PATH))
      ? (await readFile(DIAGNOSTIC_LOG_PATH)).split('\n').filter(Boolean)
      : [];

    // Rewriting the whole file (rather than appending) keeps rotation
    // trivially correct; at MAX_ENTRIES short JSON lines this is cheap.
    const trimmedEntries = [
      ...existingEntries,
      JSON.stringify(fullEntry),
    ].slice(-MAX_ENTRIES);

    await writeFile(DIAGNOSTIC_LOG_PATH, `${trimmedEntries.join('\n')}\n`);
  } catch (writeError) {
    console.warn('Failed to write diagnostic log entry:', writeError);
  }
}

/** Reads the current diagnostic log, oldest entry first. */
export async function readDiagnosticLog(): Promise<DiagnosticLogEntry[]> {
  if (!(await exists(DIAGNOSTIC_LOG_PATH))) {
    return [];
  }
  const content = await readFile(DIAGNOSTIC_LOG_PATH);
  return content
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as DiagnosticLogEntry);
}
