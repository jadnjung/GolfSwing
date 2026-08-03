import { exists, readFile, writeFile } from '@dr.pogodin/react-native-fs';
import { PROFILE_PATH, loadProfile, saveProfile } from './profileRepository';

const mockedExists = exists as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedWriteFile = writeFile as jest.Mock;

const profile = {
  handedness: 'right' as const,
  skillLevel: 'beginner' as const,
  primaryClub: 'driver' as const,
  units: 'imperial' as const,
  privacyAcknowledgedAt: '2026-08-03T00:00:00.000Z',
};

describe('loadProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no profile has been saved yet', async () => {
    mockedExists.mockResolvedValue(false);
    await expect(loadProfile()).resolves.toBeNull();
  });

  it('returns the parsed profile when one exists', async () => {
    mockedExists.mockResolvedValue(true);
    mockedReadFile.mockResolvedValue(JSON.stringify(profile));
    await expect(loadProfile()).resolves.toEqual(profile);
  });

  it('returns null (rather than throwing) when the stored profile is corrupt', async () => {
    mockedExists.mockResolvedValue(true);
    mockedReadFile.mockResolvedValue('not valid json{{{');
    await expect(loadProfile()).resolves.toBeNull();
  });
});

describe('saveProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes the profile to PROFILE_PATH', async () => {
    await saveProfile(profile);
    expect(mockedWriteFile).toHaveBeenCalledWith(
      PROFILE_PATH,
      JSON.stringify(profile, null, 2),
    );
  });
});
