/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompareScreen } from '../src/screens/CompareScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Compare'>;

function mockProps(swingIdA: string, swingIdB: string) {
  return {
    navigation: { navigate: jest.fn() },
    route: { params: { swingIdA, swingIdB } },
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

describe('CompareScreen', () => {
  it('points each video at its own swing', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <CompareScreen {...mockProps('swing-a', 'swing-b')} />,
      );
    });

    const videoA = tree!.root.findByProps({ testID: 'compare-video-a' });
    const videoB = tree!.root.findByProps({ testID: 'compare-video-b' });
    expect(videoA.props.source.uri).toBe(
      'file:///mock/documents/swings/swing-a/source.mp4',
    );
    expect(videoB.props.source.uri).toBe(
      'file:///mock/documents/swings/swing-b/source.mp4',
    );
  });

  it('tracks loading/error state independently per video', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <CompareScreen {...mockProps('swing-a', 'swing-b')} />,
      );
    });

    expect(findText(tree!, text => text.includes('Loading'))).toHaveLength(2);

    await act(async () => {
      tree!.root.findByProps({ testID: 'compare-video-a' }).props.onLoad();
    });

    // Only A's loading message clears; B's is still showing.
    expect(findText(tree!, text => text.includes('Loading'))).toHaveLength(1);

    await act(async () => {
      tree!.root.findByProps({ testID: 'compare-video-b' }).props.onError();
    });

    expect(findText(tree!, text => text.includes('Loading'))).toHaveLength(0);
    expect(
      findText(tree!, text => text.includes("Couldn't load")),
    ).toHaveLength(1);
  });
});
