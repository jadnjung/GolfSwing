// Param list for the History tab's nested stack (list -> replay -> compare).
// Kept in its own file so screens can import the type without importing
// the navigator component itself.
export type HistoryStackParamList = {
  HistoryList: undefined;
  Replay: { swingId: string };
  // MVP item 20: side-by-side comparison. `firstSwingId` is the swing the
  // user started comparing from (HistoryScreen); this screen lets them
  // pick the second one from everything else.
  SelectComparisonSwing: { firstSwingId: string };
  Compare: { swingIdA: string; swingIdB: string };
};
