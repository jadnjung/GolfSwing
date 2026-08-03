import { create } from 'zustand';
import type { Profile } from '@golf-swing/domain';
import {
  deleteProfile,
  loadProfile,
  saveProfile,
} from '../data/profileRepository';

type ProfileStatus = 'loading' | 'loaded';

interface ProfileState {
  status: ProfileStatus;
  profile: Profile | null;
  load: () => Promise<void>;
  save: (profile: Profile) => Promise<void>;
  clear: () => Promise<void>;
}

// Persisted domain state (PRD section 7.8), not session UI state — loaded
// once at app start (App.tsx) and read from here rather than reloaded per
// screen. `status` starts 'loading' so App.tsx can show nothing (or a
// loading view) instead of flashing onboarding before the disk read
// resolves.
export const useProfileStore = create<ProfileState>(set => ({
  status: 'loading',
  profile: null,
  load: async () => {
    const profile = await loadProfile();
    set({ profile, status: 'loaded' });
  },
  save: async profile => {
    await saveProfile(profile);
    set({ profile, status: 'loaded' });
  },
  // Part of "delete all data" (PRD 9.8) — clears the persisted profile and
  // drops it from the store in one call, sending the user back through
  // onboarding (App.tsx) without a redundant disk read.
  clear: async () => {
    await deleteProfile();
    set({ profile: null, status: 'loaded' });
  },
}));
