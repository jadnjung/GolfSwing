/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { readDir, readFile } from '@dr.pogodin/react-native-fs';
import { SelectComparisonSwingScreen } from '../src/screens/SelectComparisonSwingScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;

type Props = NativeStackScreenProps<
  HistoryStackParamList,
  'SelectComparisonSwing'
>;

function mockProps(firstSwingId: string) {
  return {
    navigation: { navigate: jest.fn() },
    route: { params: { firstSwingId } },
  } as unknown as Props;
}

function dirEntry(name: string) {
  return {
    path: `/mock/documents/swings/${name}`,
    name,
    size: 0,
    mtime: null,
    ctime: null,
    isDirectory: () => true,
    isFile: () => false,
  };
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

const manifestFor = (id: string) => ({
  id,
  createdAt: '2026-08-03T00:00:00.000Z',
  clubType: 'driver',
  cameraView: 'face-on',
  cameraPosition: 'back',
  frameRate: 60,
  durationMs: 4200,
  analysisStatus: 'pending',
  handedness: 'right',
});

describe('SelectComparisonSwingScreen', () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => {
      tree?.unmount();
    });
    tree = undefined;
    jest.clearAllMocks();
  });

  it('excludes the first swing from the candidate list', async () => {
    mockedReadDir.mockResolvedValue([dirEntry('swing-1'), dirEntry('swing-2')]);
    mockedReadFile.mockImplementation(async (path: string) => {
      const id = path.includes('swing-1') ? 'swing-1' : 'swing-2';
      return JSON.stringify(manifestFor(id));
    });

    await act(async () => {
      tree = ReactTestRenderer.create(
        <SelectComparisonSwingScreen {...mockProps('swing-1')} />,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: 'comparison-candidate-row' }).length,
    ).toBeGreaterThan(0);
  });

  it('shows a message when there is nothing else to compare with', async () => {
    mockedReadDir.mockResolvedValue([dirEntry('swing-1')]);
    mockedReadFile.mockResolvedValue(JSON.stringify(manifestFor('swing-1')));

    await act(async () => {
      tree = ReactTestRenderer.create(
        <SelectComparisonSwingScreen {...mockProps('swing-1')} />,
      );
    });

    expect(
      findText(tree!, text => text.includes('No other swings')),
    ).toHaveLength(1);
  });

  it('navigates to Compare with both swing ids when a candidate is tapped', async () => {
    mockedReadDir.mockResolvedValue([dirEntry('swing-1'), dirEntry('swing-2')]);
    mockedReadFile.mockImplementation(async (path: string) => {
      const id = path.includes('swing-1') ? 'swing-1' : 'swing-2';
      return JSON.stringify(manifestFor(id));
    });

    const props = mockProps('swing-1');
    await act(async () => {
      tree = ReactTestRenderer.create(
        <SelectComparisonSwingScreen {...props} />,
      );
    });

    const [row] = tree!.root.findAllByProps({
      testID: 'comparison-candidate-row',
    });
    await act(async () => {
      row!.props.onPress();
    });

    expect(props.navigation.navigate).toHaveBeenCalledWith('Compare', {
      swingIdA: 'swing-1',
      swingIdB: 'swing-2',
    });
  });
});
