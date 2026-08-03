/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReplayScreen } from '../src/screens/ReplayScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

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
});
