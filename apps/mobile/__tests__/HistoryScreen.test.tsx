/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { readDir, readFile, unlink } from '@dr.pogodin/react-native-fs';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedUnlink = unlink as jest.Mock;

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
    mockOneSavedSwing();

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
    mockOneSavedSwing();

    const props = mockNavigationProps();
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<HistoryScreen {...props} />);
    });

    const [row] = tree!.root.findAllByProps({ testID: 'swing-row-content' });
    await act(async () => {
      row!.props.onPress();
    });

    expect(props.navigation.navigate).toHaveBeenCalledWith('Replay', {
      swingId: 'swing-1',
    });
  });

  it('deletes a swing after the user confirms, and refreshes the list', async () => {
    mockOneSavedSwing();
    mockedUnlink.mockResolvedValue(undefined);
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        const deleteButton = buttons?.find(
          button => button.style === 'destructive',
        );
        deleteButton?.onPress?.();
      });

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    // Deleting resolves to an empty list on the next `listSwings()` call.
    mockedReadDir.mockResolvedValue([]);

    const [deleteButton] = tree!.root.findAllByProps({
      testID: 'delete-swing-button',
    });
    await act(async () => {
      deleteButton!.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(mockedUnlink).toHaveBeenCalledWith('/mock/documents/swings/swing-1');
    expect(
      findText(tree!, text => text.includes('No swings recorded yet')),
    ).toHaveLength(1);

    alertSpy.mockRestore();
  });

  it('shows an error if deletion fails, without crashing', async () => {
    mockOneSavedSwing();
    mockedUnlink.mockRejectedValue(new Error('permission denied'));
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        const deleteButton = buttons?.find(
          button => button.style === 'destructive',
        );
        deleteButton?.onPress?.();
      });

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    const [deleteButton] = tree!.root.findAllByProps({
      testID: 'delete-swing-button',
    });
    await act(async () => {
      deleteButton!.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Couldn't delete this swing",
      'permission denied',
    );

    alertSpy.mockRestore();
  });
});
