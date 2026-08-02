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
import { RecordScreen } from '../src/screens/RecordScreen';

const mockedCamera = Camera as unknown as {
  getCameraPermissionStatus: jest.Mock;
  requestCameraPermission: jest.Mock;
  getMicrophonePermissionStatus: jest.Mock;
};
const mockedUseCameraDevice = useCameraDevice as jest.Mock;

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
