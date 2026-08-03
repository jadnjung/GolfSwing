/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { readDir, readFile } from '@dr.pogodin/react-native-fs';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>;

// HistoryScreen receives `navigation`/`route` as props from React Navigation
// at runtime (it's registered via `component={HistoryScreen}`); tests supply
// a minimal stand-in rather than rendering a full NavigationContainer.
function mockNavigationProps() {
  return {
    navigation: { navigate: jest.fn() },
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

describe('HistoryScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty state when no swings are recorded', async () => {
    mockedReadDir.mockResolvedValue([]);

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    expect(
      findText(tree!, text => text.includes('No swings recorded yet')),
    ).toHaveLength(1);
  });

  it('renders saved swings fetched from the repository', async () => {
    mockedReadDir.mockResolvedValue([
      {
        path: '/mock/documents/swings/swing-1',
        name: 'swing-1',
        size: 0,
        mtime: null,
        ctime: null,
        isDirectory: () => true,
        isFile: () => false,
      },
    ]);
    mockedReadFile.mockResolvedValue(
      JSON.stringify({
        id: 'swing-1',
        createdAt: '2026-08-03T00:00:00.000Z',
        clubType: 'driver',
        cameraView: 'face-on',
        cameraPosition: 'back',
        frameRate: 60,
        durationMs: 4200,
        analysisStatus: 'pending',
        handedness: 'right',
      }),
    );

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: 'swing-row' }).length,
    ).toBeGreaterThan(0);
    expect(findText(tree!, text => text.includes('driver'))).toHaveLength(1);
  });

  it('navigates to Replay with the tapped swing id', async () => {
    mockedReadDir.mockResolvedValue([
      {
        path: '/mock/documents/swings/swing-1',
        name: 'swing-1',
        size: 0,
        mtime: null,
        ctime: null,
        isDirectory: () => true,
        isFile: () => false,
      },
    ]);
    mockedReadFile.mockResolvedValue(
      JSON.stringify({
        id: 'swing-1',
        createdAt: '2026-08-03T00:00:00.000Z',
        clubType: 'driver',
        cameraView: 'face-on',
        cameraPosition: 'back',
        frameRate: 60,
        durationMs: 4200,
        analysisStatus: 'pending',
        handedness: 'right',
      }),
    );

    const props = mockNavigationProps();
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<HistoryScreen {...props} />);
    });

    const [row] = tree!.root.findAllByProps({ testID: 'swing-row' });
    await act(async () => {
      row!.props.onPress();
    });

    expect(props.navigation.navigate).toHaveBeenCalledWith('Replay', {
      swingId: 'swing-1',
    });
  });
});
