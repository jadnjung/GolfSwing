import {
  DocumentDirectoryPath,
  exists,
  readFile,
  writeFile,
} from '@dr.pogodin/react-native-fs';
import { parseProfile, type Profile } from '@golf-swing/domain';

export const PROFILE_PATH = `${DocumentDirectoryPath}/profile.json`;

/**
 * Loads the onboarded profile, or null if onboarding hasn't happened yet
 * (no file) or the stored profile is corrupt (parse/validation failure) —
 * both cases send the user back through onboarding rather than crashing
 * or running with made-up defaults for e.g. handedness.
 */
export async function loadProfile(): Promise<Profile | null> {
  if (!(await exists(PROFILE_PATH))) {
    return null;
  }
  try {
    return parseProfile(JSON.parse(await readFile(PROFILE_PATH)));
  } catch (error) {
    console.warn('Ignoring unreadable profile:', error);
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2));
}
