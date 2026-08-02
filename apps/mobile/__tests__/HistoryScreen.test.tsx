/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { readDir, readFile } from '@dr.pogodin/react-native-fs';
import { HistoryScreen } from '../src/screens/HistoryScreen';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;

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
      tree = ReactTestRenderer.create(<HistoryScreen />);
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
      }),
    );

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<HistoryScreen />);
    });

    expect(
      tree!.root.findAllByProps({ testID: 'swing-row' }).length,
    ).toBeGreaterThan(0);
    expect(findText(tree!, text => text.includes('driver'))).toHaveLength(1);
  });
});
