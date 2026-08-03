import { create } from 'zustand';
import type { Profile } from '@golf-swing/domain';
import { loadProfile, saveProfile } from '../data/profileRepository';

type ProfileStatus = 'loading' | 'loaded';

interface ProfileState {
  status: ProfileStatus;
  profile: Profile | null;
  load: () => Promise<void>;
  save: (profile: Profile) => Promise<void>;
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
}));
