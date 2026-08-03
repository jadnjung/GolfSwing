import {
  exists,
  readFile,
  unlink,
  writeFile,
} from '@dr.pogodin/react-native-fs';
import { useProfileStore } from './profileStore';

const mockedExists = exists as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedWriteFile = writeFile as jest.Mock;
const mockedUnlink = unlink as jest.Mock;

const profile = {
  handedness: 'right' as const,
  skillLevel: 'beginner' as const,
  primaryClub: 'driver' as const,
  units: 'imperial' as const,
  privacyAcknowledgedAt: '2026-08-03T00:00:00.000Z',
};

describe('useProfileStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
    useProfileStore.setState({ status: 'loading', profile: null });
  });

  it('starts in a loading state with no profile', () => {
    expect(useProfileStore.getState().status).toBe('loading');
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('load() resolves to no profile when none is saved', async () => {
    mockedExists.mockResolvedValue(false);
    await useProfileStore.getState().load();
    expect(useProfileStore.getState()).toMatchObject({
      status: 'loaded',
      profile: null,
    });
  });

  it('load() resolves to the saved profile when one exists', async () => {
    mockedExists.mockResolvedValue(true);
    mockedReadFile.mockResolvedValue(JSON.stringify(profile));
    await useProfileStore.getState().load();
    expect(useProfileStore.getState()).toMatchObject({
      status: 'loaded',
      profile,
    });
  });

  it('save() persists and updates the store', async () => {
    await useProfileStore.getState().save(profile);
    expect(mockedWriteFile).toHaveBeenCalled();
    expect(useProfileStore.getState()).toMatchObject({
      status: 'loaded',
      profile,
    });
  });

  it('clear() deletes the persisted profile and resets the store', async () => {
    useProfileStore.setState({ status: 'loaded', profile });
    mockedExists.mockResolvedValue(true);

    await useProfileStore.getState().clear();

    expect(mockedUnlink).toHaveBeenCalled();
    expect(useProfileStore.getState()).toMatchObject({
      status: 'loaded',
      profile: null,
    });
  });
});
