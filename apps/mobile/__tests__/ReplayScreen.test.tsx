/**
 * @format
 */

import { readFile } from '@dr.pogodin/react-native-fs';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Share from 'react-native-share';
import Video from 'react-native-video';
import { ReplayScreen } from '../src/screens/ReplayScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

const mockedShareOpen = Share.open as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedSeek = (Video as unknown as { mockSeek: jest.Mock }).mockSeek;

const manifest = {
  id: 'swing-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  clubType: 'driver',
  cameraView: 'face-on',
  cameraPosition: 'front',
  frameRate: 30,
  durationMs: 3000,
  analysisStatus: 'pending',
  handedness: 'right',
};

type Props = NativeStackScreenProps<HistoryStackParamList, 'Replay'>;

function mockProps(swingId: string) {
  return {
    navigation: { navigate: jest.fn() },
    route: { params: { swingId } },
  } as unknown as Props;
}

function findText(
  tree: ReactTestRenderer.ReactTestRenderer,
  matcher: (text: string) => boolean,
) {
  return tree.root.findAll(node => {
    if (node.type !== Text) {
      return false;
    }
    const { children } = node.props;
    const text = Array.isArray(children) ? children.join('') : children;
    return typeof text === 'string' && matcher(text);
  });
}

describe('ReplayScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("points the video at the swing's source file and shows a loading state", async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    const video = tree!.root.findByProps({ testID: 'replay-video' });
    expect(video.props.source.uri).toBe(
      'file:///mock/documents/swings/swing-1/source.mp4',
    );
    expect(findText(tree!, text => text.includes('Loading'))).toHaveLength(1);
  });

  it('clears the loading state once the video loads', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'replay-video' }).props.onLoad();
    });

    expect(findText(tree!, text => text.includes('Loading'))).toHaveLength(0);
  });

  it('shows an error state when the video fails to load', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'replay-video' }).props.onError();
    });

    expect(
      findText(tree!, text => text.includes("Couldn't load")),
    ).toHaveLength(1);
  });

  it('opens the share sheet for the source video on export', async () => {
    mockedShareOpen.mockResolvedValue({ success: true });

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      await tree!.root.findByProps({ testID: 'export-button' }).props.onPress();
    });

    expect(mockedShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///mock/documents/swings/swing-1/source.mp4',
        type: 'video/mp4',
        filename: 'swing-swing-1',
      }),
    );
  });

  it('does not show an error when the user dismisses the share sheet', async () => {
    mockedShareOpen.mockResolvedValue({
      success: false,
      dismissedAction: true,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      await tree!.root.findByProps({ testID: 'export-button' }).props.onPress();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('shows an error alert when export genuinely fails', async () => {
    mockedShareOpen.mockRejectedValue(new Error('no app available'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      await tree!.root.findByProps({ testID: 'export-button' }).props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Couldn't export this swing",
      'no app available',
    );
    alertSpy.mockRestore();
  });

  it("steps forward and back by one of the swing's recorded frame durations", async () => {
    mockedReadFile.mockResolvedValue(JSON.stringify(manifest));

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'replay-video' }).props.onProgress({
        currentTime: 1,
      });
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'frame-step-forward-button' })
        .props.onPress();
    });
    expect(mockedSeek).toHaveBeenLastCalledWith(1 + 1 / 30);

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'frame-step-back-button' })
        .props.onPress();
    });
    expect(mockedSeek).toHaveBeenLastCalledWith(1);
  });

  it('does not seek before the start of the video', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'frame-step-back-button' })
        .props.onPress();
    });
    expect(mockedSeek).toHaveBeenLastCalledWith(0);
  });

  it('sets the video rate when a slow-motion option is chosen', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'playback-rate-0.5x-button' })
        .props.onPress();
    });

    expect(
      tree!.root.findByProps({ testID: 'replay-video' }).props.rate,
    ).toBe(0.5);
  });

  it('falls back to a default frame duration when the manifest is unreadable', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ReplayScreen {...mockProps('swing-1')} />,
      );
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'frame-step-forward-button' })
        .props.onPress();
    });
    expect(mockedSeek).toHaveBeenLastCalledWith(1 / 30);
  });
});
