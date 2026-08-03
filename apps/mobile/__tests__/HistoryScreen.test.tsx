/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  readDir,
  readFile,
  unlink,
  writeFile,
} from '@dr.pogodin/react-native-fs';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import type { HistoryStackParamList } from '../src/navigation/types';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedUnlink = unlink as jest.Mock;
const mockedWriteFile = writeFile as jest.Mock;

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
  tags: ['favorite'],
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
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => {
      tree?.unmount();
    });
    tree = undefined;
    jest.clearAllMocks();
  });

  it('shows an empty state when no swings are recorded', async () => {
    mockedReadDir.mockResolvedValue([]);

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

  it('navigates to SelectComparisonSwing when Compare is tapped', async () => {
    mockOneSavedSwing();

    const props = mockNavigationProps();
    await act(async () => {
      tree = ReactTestRenderer.create(<HistoryScreen {...props} />);
    });

    const [compareButton] = tree!.root.findAllByProps({
      testID: 'compare-swing-button',
    });
    await act(async () => {
      compareButton!.props.onPress();
    });

    expect(props.navigation.navigate).toHaveBeenCalledWith(
      'SelectComparisonSwing',
      { firstSwingId: 'swing-1' },
    );
  });

  it('shows the estimated storage to be freed in the delete confirmation', async () => {
    mockedReadDir.mockImplementation(async (path: string) => {
      if (path === '/mock/documents/swings') {
        return [
          {
            path: '/mock/documents/swings/swing-1',
            name: 'swing-1',
            size: 0,
            mtime: null,
            ctime: null,
            isDirectory: () => true,
            isFile: () => false,
          },
        ];
      }
      // getSwingSizeBytes reading the swing's own directory contents.
      return [
        {
          path: `${path}/source.mp4`,
          name: 'source.mp4',
          size: 2 * 1024 * 1024,
          mtime: null,
          ctime: null,
          isDirectory: () => false,
          isFile: () => true,
        },
      ];
    });
    mockedReadFile.mockResolvedValue(JSON.stringify(savedManifest));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    await act(async () => {
      await tree!.root
        .findByProps({ testID: 'delete-swing-button' })
        .props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete this swing?',
      expect.stringContaining('2.0 MB'),
      expect.anything(),
    );

    alertSpy.mockRestore();
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

  it('opens the tag editor, adds a tag, and saves it', async () => {
    mockOneSavedSwing();
    mockedWriteFile.mockResolvedValue(undefined);

    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'edit-tags-button' }).props.onPress();
    });

    expect(
      tree!.root.findAllByProps({ testID: 'tag-editor-modal' }).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'tag-input' })
        .props.onChangeText('needs work');
    });
    await act(async () => {
      tree!.root.findByProps({ testID: 'tag-input' }).props.onSubmitEditing();
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'tag-editor-save' }).props.onPress();
    });

    expect(mockedWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('swing-1'),
      expect.stringContaining('needs work'),
    );
    expect(
      tree!.root.findAllByProps({ testID: 'tag-editor-modal' }).length,
    ).toBe(0);
  });

  it('removes a tag by tapping its chip in the editor', async () => {
    mockOneSavedSwing();
    mockedWriteFile.mockResolvedValue(undefined);

    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'edit-tags-button' }).props.onPress();
    });

    const [chip] = tree!.root.findAllByProps({ testID: 'tag-chip' });
    await act(async () => {
      chip!.props.onPress();
    });
    await act(async () => {
      tree!.root.findByProps({ testID: 'tag-editor-save' }).props.onPress();
    });

    const [, writtenContent] = mockedWriteFile.mock.calls[0]!;
    expect(JSON.parse(writtenContent).tags).toEqual([]);
  });

  it('closes the editor without saving when cancelled', async () => {
    mockOneSavedSwing();

    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryScreen {...mockNavigationProps()} />,
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'edit-tags-button' }).props.onPress();
    });
    await act(async () => {
      tree!.root.findByProps({ testID: 'tag-editor-cancel' }).props.onPress();
    });

    expect(mockedWriteFile).not.toHaveBeenCalled();
    expect(
      tree!.root.findAllByProps({ testID: 'tag-editor-modal' }).length,
    ).toBe(0);
  });
});
