/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import {
  Camera,
  useCameraDevice,
  type CameraDevice,
} from 'react-native-vision-camera';
import { mkdir, moveFile, writeFile } from '@dr.pogodin/react-native-fs';
import { RecordScreen } from '../src/screens/RecordScreen';
import { useProfileStore } from '../src/state/profileStore';

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
