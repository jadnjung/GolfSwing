/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { readDir, readFile } from '@dr.pogodin/react-native-fs';
import { HomeScreen } from '../src/screens/HomeScreen';
import { Button } from '../src/components/Button';
import type { RootTabParamList } from '../src/navigation/types';

// HomeScreen renders standalone here (no real NavigationContainer/Screen),
// so useFocusEffect would otherwise throw looking for navigation context it
// doesn't have. Runs the effect once on mount - a faithful enough stand-in
// for "this screen is focused" for tests that don't exercise blur/refocus.
// Same pattern as HistoryScreen.test.tsx, which needed the same workaround.
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actual,
    useFocusEffect: jest.fn((effect: () => void | (() => void)) => {
      ReactActual.useEffect(effect, [effect]);
    }),
  };
});

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;

const savedManifest = {
  id: 'swing-1',
  createdAt: '2026-08-03T00:00:00.000Z',
  clubType: 'driver',
  cameraView: 'face-on',
  cameraPosition: 'back',
  frameRate: 60,
  durationMs: 4200,
  analysisStatus: 'pending',
  handedness: 'right',
  tags: [],
};

function mockOneSavedSwing() {
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
  mockedReadFile.mockResolvedValue(JSON.stringify(savedManifest));
}

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

// HomeScreen receives `navigation`/`route` as props from React Navigation at
// runtime (it's registered via `component={HomeScreen}`); tests supply a
// minimal stand-in rather than rendering a full NavigationContainer.
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

describe('HomeScreen', () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => {
      tree?.unmount();
    });
    tree = undefined;
    jest.clearAllMocks();
  });

  it('shows an empty state when no swings are recorded yet', async () => {
    mockedReadDir.mockResolvedValue([]);

    await act(async () => {
      tree = ReactTestRenderer.create(
        <HomeScreen {...mockNavigationProps()} />,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: 'home-empty-state' }).length,
    ).toBeGreaterThan(0);
  });

  it('shows recent swings fetched from the repository', async () => {
    mockOneSavedSwing();

    await act(async () => {
      tree = ReactTestRenderer.create(
        <HomeScreen {...mockNavigationProps()} />,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: 'home-recent-swing-row' }).length,
    ).toBeGreaterThan(0);
    expect(findText(tree!, text => text.includes('driver'))).toHaveLength(1);
  });

  it('navigates to the Record tab when the record CTA is tapped', async () => {
    mockedReadDir.mockResolvedValue([]);

    const props = mockNavigationProps();
    await act(async () => {
      tree = ReactTestRenderer.create(<HomeScreen {...props} />);
    });

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'home-record-cta' })
        .findByType(Button)
        .props.onPress();
    });

    expect(props.navigation.navigate).toHaveBeenCalledWith('Record');
  });

  it('navigates to the History tab when "See all" is tapped', async () => {
    mockOneSavedSwing();

    const props = mockNavigationProps();
    await act(async () => {
      tree = ReactTestRenderer.create(<HomeScreen {...props} />);
    });

    await act(async () => {
      tree!.root
        .findAllByProps({
          accessibilityLabel: 'View all swings in History',
        })[0]!
        .props.onPress();
    });

    expect(props.navigation.navigate).toHaveBeenCalledWith('History');
  });
});
