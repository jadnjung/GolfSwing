/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  type CameraDevice,
} from 'react-native-vision-camera';
import { mkdir, moveFile, writeFile } from '@dr.pogodin/react-native-fs';
import { RecordScreen } from '../src/screens/RecordScreen';
import { useProfileStore } from '../src/state/profileStore';

// RecordScreen renders standalone here (no real NavigationContainer/Screen
// wrapping it), so useIsFocused would otherwise throw looking for navigation
// context it doesn't have. Defaults to focused; the orientation-lock test
// below overrides it to false.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: jest.fn(() => true),
}));

const mockedUseIsFocused = useIsFocused as jest.Mock;

// RecordScreen reads handedness from the profile store, non-null, on the
// assumption RootNavigator never mounts it without one (App.tsx). Seed
// that invariant for every test in this file.
beforeEach(() => {
  useProfileStore.setState({
    status: 'loaded',
    profile: {
      handedness: 'right',
      skillLevel: 'beginner',
      primaryClub: 'driver',
      units: 'imperial',
      privacyAcknowledgedAt: '2026-08-03T00:00:00.000Z',
    },
  });
});

const mockedCamera = Camera as unknown as {
  getCameraPermissionStatus: jest.Mock;
  requestCameraPermission: jest.Mock;
  getMicrophonePermissionStatus: jest.Mock;
  mockStartRecording: jest.Mock;
  mockStopRecording: jest.Mock;
};
const mockedUseCameraDevice = useCameraDevice as jest.Mock;
const mockedUseCameraFormat = useCameraFormat as jest.Mock;
const mockedMkdir = mkdir as jest.Mock;
const mockedMoveFile = moveFile as jest.Mock;
const mockedWriteFile = writeFile as jest.Mock;

function findText(tree: ReactTestRenderer.ReactTestRenderer, text: string) {
  return tree.root.findAll(
    node => node.type === Text && node.props.children?.toString?.() === text,
  );
}

// findAllByProps matches both the composite element and its underlying host
// node when a prop like testID passes through unchanged, so a "present"
// element yields 2 matches, not 1 — assert presence/absence, not an exact
// count.
function existsByTestId(
  tree: ReactTestRenderer.ReactTestRenderer,
  testID: string,
) {
  return tree.root.findAllByProps({ testID }).length > 0;
}

describe('RecordScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // clearAllMocks doesn't reset mockReturnValue overrides — restore the
    // module mock's default so a false override in one test can't leak into
    // the next.
    mockedUseIsFocused.mockReturnValue(true);
  });

  it('shows a permission gate before camera access is granted, then the preview once granted', async () => {
    mockedCamera.getCameraPermissionStatus.mockReturnValue('not-determined');
    mockedCamera.requestCameraPermission.mockResolvedValue('granted');
    mockedUseCameraDevice.mockReturnValue({
      id: 'mock-device',
    } as unknown as CameraDevice);

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    // Not yet granted: the gate is shown, not a camera preview.
    expect(findText(tree!, 'Grant camera access')).toHaveLength(1);
    expect(existsByTestId(tree!, 'camera-preview-wrapper')).toBe(false);

    const [grantButton] = tree!.root.findAllByProps({
      testID: 'grant-camera-access-button',
    });
    expect(grantButton).toBeDefined();
    await act(async () => {
      grantButton!.props.onPress();
    });

    // requestCameraPermission was called for real (not bypassed), and the UI
    // reflects its actual resolved value — a real state transition, not a
    // fixed render.
    expect(mockedCamera.requestCameraPermission).toHaveBeenCalledTimes(1);
    expect(findText(tree!, 'Grant camera access')).toHaveLength(0);
    expect(existsByTestId(tree!, 'camera-preview-wrapper')).toBe(true);
  });

  it('locks to landscape while the camera is ready and this tab is focused', async () => {
    mockedCamera.getCameraPermissionStatus.mockReturnValue('granted');
    mockedUseCameraDevice.mockReturnValue({
      id: 'mock-device',
    } as unknown as CameraDevice);

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    expect(
      tree!.root.findByProps({ testID: 'orientation-locker' }).props
        .orientation,
    ).toBe('LANDSCAPE');
  });

  it('explicitly unlocks (not just unmounts) once this tab loses focus', async () => {
    mockedCamera.getCameraPermissionStatus.mockReturnValue('granted');
    mockedUseCameraDevice.mockReturnValue({
      id: 'mock-device',
    } as unknown as CameraDevice);
    mockedUseIsFocused.mockReturnValue(false);

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    // Bottom-tab navigators keep this screen mounted when another tab is
    // focused (docs/adr/0013), and this library only auto-unlocks when a
    // mounted locker explicitly requests UNLOCK — an unmounted locker
    // wouldn't release a lock at all. The camera preview itself still shows
    // (permission/device are unrelated to tab focus).
    expect(existsByTestId(tree!, 'camera-preview-wrapper')).toBe(true);
    expect(
      tree!.root.findByProps({ testID: 'orientation-locker' }).props
        .orientation,
    ).toBe('UNLOCK');
  });
});

describe('RecordScreen recording flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedCamera.getCameraPermissionStatus.mockReturnValue('granted');
    mockedUseCameraDevice.mockReturnValue({
      id: 'mock-device',
    } as unknown as CameraDevice);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    // clearAllMocks doesn't reset a mockReturnValue override - restore the
    // module mock's default so a test's override can't leak into the next.
    mockedUseCameraFormat.mockReturnValue(undefined);
  });

  it('counts down, starts recording, and saves the finished video locally', async () => {
    mockedCamera.mockStartRecording.mockImplementation(
      (options: { onRecordingFinished: (video: unknown) => void }) => {
        options.onRecordingFinished({
          path: '/tmp/mock-video.mov',
          duration: 4.2,
          width: 1920,
          height: 1080,
        });
      },
    );

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    const [recordButton] = tree!.root.findAllByProps({
      testID: 'record-button',
    });
    act(() => {
      recordButton!.props.onPress();
    });

    // Default countdown is 3 seconds (recordingSetupStore's default). Each
    // tick reschedules its own setTimeout from a useEffect, so React needs to
    // flush a render between each one — advance one second at a time rather
    // than the full 3000ms in one call.
    expect(existsByTestId(tree!, 'countdown-overlay')).toBe(true);

    for (let tick = 0; tick < 3; tick += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(mockedCamera.mockStartRecording).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedMkdir).toHaveBeenCalledWith(
      expect.stringContaining('/mock/documents/swings/'),
    );
    expect(mockedMoveFile).toHaveBeenCalledWith(
      '/tmp/mock-video.mov',
      expect.stringContaining('/source.mp4'),
    );
    expect(mockedWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('/analysis-manifest.json'),
      expect.stringContaining('"analysisStatus": "pending"'),
    );
    expect(mockedWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('/analysis-manifest.json'),
      expect.stringContaining('"handedness": "right"'),
    );
    expect(existsByTestId(tree!, 'save-confirmation')).toBe(true);
    // A raw UUID here was meaningless to a real user - just a clean
    // confirmation now, not "Saved swing <uuid>".
    expect(findText(tree!, 'Swing saved')).toHaveLength(1);
  });

  it('shows an elapsed-time indicator while recording, gone once it stops', async () => {
    let finishRecording: (video: unknown) => void = () => {};
    mockedCamera.mockStartRecording.mockImplementation(
      (options: { onRecordingFinished: (video: unknown) => void }) => {
        // Deliberately not invoked immediately, unlike the other tests in
        // this file - this test needs to observe the 'recording' stage
        // itself (the indicator, the timer ticking), not just its outcome.
        finishRecording = options.onRecordingFinished;
      },
    );

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    const [recordButton] = tree!.root.findAllByProps({
      testID: 'record-button',
    });
    act(() => {
      recordButton!.props.onPress();
    });
    for (let tick = 0; tick < 3; tick += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(existsByTestId(tree!, 'recording-indicator')).toBe(true);
    expect(findText(tree!, '0:00')).toHaveLength(1);

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(findText(tree!, '0:03')).toHaveLength(1);

    act(() => {
      finishRecording({
        path: '/tmp/mock-video.mov',
        duration: 3.0,
        width: 1920,
        height: 1080,
      });
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(existsByTestId(tree!, 'recording-indicator')).toBe(false);
  });

  it("records the manifest's frameRate clamped to what the device format actually supports", async () => {
    // recordingSetupStore's default frameRate is 60; a format capping out
    // at 30fps should clamp to it, not silently claim 60 in the manifest -
    // ReplayScreen's frame-stepping relies on this being accurate.
    mockedUseCameraFormat.mockReturnValue({ minFps: 1, maxFps: 30 });
    mockedCamera.mockStartRecording.mockImplementation(
      (options: { onRecordingFinished: (video: unknown) => void }) => {
        options.onRecordingFinished({
          path: '/tmp/mock-video.mov',
          duration: 4.2,
          width: 1920,
          height: 1080,
        });
      },
    );

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    expect(
      tree!.root.findByProps({ testID: 'frame-rate-degraded-note' }),
    ).toBeDefined();

    const [recordButton] = tree!.root.findAllByProps({
      testID: 'record-button',
    });
    act(() => {
      recordButton!.props.onPress();
    });

    for (let tick = 0; tick < 3; tick += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('/analysis-manifest.json'),
      expect.stringContaining('"frameRate": 30'),
    );
  });

  it('stops recording when the Stop button is pressed', async () => {
    mockedCamera.mockStartRecording.mockImplementation(() => {});

    let tree: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(<RecordScreen />);
    });

    const [recordButton] = tree!.root.findAllByProps({
      testID: 'record-button',
    });
    act(() => {
      recordButton!.props.onPress();
    });
    for (let tick = 0; tick < 3; tick += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    const [stopButton] = tree!.root.findAllByProps({ testID: 'stop-button' });
    expect(stopButton).toBeDefined();
    await act(async () => {
      await stopButton!.props.onPress();
    });

    expect(mockedCamera.mockStopRecording).toHaveBeenCalledTimes(1);
  });
});
