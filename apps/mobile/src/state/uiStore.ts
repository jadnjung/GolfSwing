import { create } from 'zustand';

// UI state (PRD section 7.8): ephemeral, screen-level state — not domain
// data, which will come from local repositories once they exist.
export type TabName = 'Home' | 'Record' | 'History' | 'Training' | 'Settings';

interface UiState {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

export const useUiStore = create<UiState>(set => ({
  activeTab: 'Home',
  setActiveTab: tab => set({ activeTab: tab }),
}));
