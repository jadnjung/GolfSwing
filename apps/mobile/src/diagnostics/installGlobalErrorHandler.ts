import { appendDiagnosticLog } from './diagnosticLog';

type ErrorHandler = (error: Error, isFatal?: boolean) => void;

interface ErrorUtilsGlobal {
  ErrorUtils?: {
    getGlobalHandler: () => ErrorHandler;
    setGlobalHandler: (handler: ErrorHandler) => void;
  };
}

/**
 * Catches fatal JS errors outside React's render tree (e.g. thrown inside
 * an async callback or event handler), which ErrorBoundary cannot see —
 * PRD 6.3 asks the app to recover from interrupted analysis, model
 * initialization failure, and similar async failure points.
 *
 * Wraps, rather than replaces, React Native's own global handler so the
 * dev redbox and any native crash reporting added later (PRD 14.1) still
 * run after this has logged locally.
 */
export function installGlobalErrorHandler(): void {
  const errorUtils = (globalThis as unknown as ErrorUtilsGlobal).ErrorUtils;
  if (errorUtils == null) {
    return;
  }

  const previousHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    appendDiagnosticLog({
      level: 'error',
      message: error.message,
      ...(error.stack != null ? { stack: error.stack } : {}),
    }).finally(() => previousHandler(error, isFatal));
  });
}
