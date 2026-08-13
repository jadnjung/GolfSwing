// Shared swing-display formatting — was duplicated identically in
// HistoryScreen before HomeScreen's dashboard needed the same "3.2s" /
// "Aug 13, 2026, 4:15 PM" formatting for its recent-swings preview.
export function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}
