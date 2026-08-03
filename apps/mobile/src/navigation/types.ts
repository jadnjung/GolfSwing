// Param list for the History tab's nested stack (list -> replay). Kept in
// its own file so screens can import the type without importing the
// navigator component itself.
export type HistoryStackParamList = {
  HistoryList: undefined;
  Replay: { swingId: string };
};
