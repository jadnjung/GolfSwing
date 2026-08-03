/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { exists, unlink } from '@dr.pogodin/react-native-fs';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { useProfileStore } from '../src/state/profileStore';

const mockedUnlink = unlink as jest.Mock;
const mockedExists = exists as jest.Mock;

const profile = {
  handedness: 'right' as const,
  skillLevel: 'beginner' as const,
  primaryClub: 'driver' as const,
  units: 'imperial' as const,
  privacyAcknowledgedAt: '2026-08-03T00:00:00.000Z',
};

function confirmDestructiveAlert() {
  const alertSpy = jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) => {
      const destructive = buttons?.find(
        button => button.style === 'destructive',
      );
      destructive?.onPress?.();
    });
  return alertSpy;
}

describe('SettingsScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
    useProfileStore.setState({ status: 'loaded', profile: null });
  });

  it('deletes all swings and resets the profile after confirming', async () => {
    useProfileStore.setState({ status: 'loaded', profile });
    mockedExists.mockResolvedValue(true);
    mockedUnlink.mockResolvedValue(undefined);
    const alertSpy = confirmDestructiveAlert();

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<SettingsScreen />);
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'delete-all-data-button' })
        .props.onPress();
    });

    expect(alertSpy).toHaveBeenCalled();
    // Both the swings root and the profile file get unlinked.
    expect(mockedUnlink).toHaveBeenCalledTimes(2);
    expect(useProfileStore.getState().profile).toBeNull();

    alertSpy.mockRestore();
  });

  it('shows an error if deletion fails, without crashing', async () => {
    useProfileStore.setState({ status: 'loaded', profile });
    mockedExists.mockResolvedValue(true);
    mockedUnlink.mockRejectedValue(new Error('permission denied'));
    const alertSpy = confirmDestructiveAlert();

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<SettingsScreen />);
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'delete-all-data-button' })
        .props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Couldn't delete all data",
      'permission denied',
    );
    // The profile is untouched since deleteAllSwings failed first.
    expect(useProfileStore.getState().profile).toEqual(profile);

    alertSpy.mockRestore();
  });
});
