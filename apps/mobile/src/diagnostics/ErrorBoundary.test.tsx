import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { writeFile } from '@dr.pogodin/react-native-fs';
import { ErrorBoundary } from './ErrorBoundary';

const mockedWriteFile = writeFile as jest.Mock;

function Bomb(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when nothing throws', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ErrorBoundary>
          <Text>fine</Text>
        </ErrorBoundary>,
      );
    });

    expect(tree!.root.findAllByType(Text)[0]!.props.children).toBe('fine');
  });

  it('renders a fallback and logs when a child throws', async () => {
    // React logs the caught error to the console by default; suppress the
    // expected noise so the test output stays readable.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    let tree: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: 'error-boundary-fallback' }).length,
    ).toBeGreaterThan(0);
    expect(mockedWriteFile).toHaveBeenCalled();
    const [, content] = mockedWriteFile.mock.calls[0];
    expect(JSON.parse(content.trim())).toMatchObject({
      level: 'error',
      message: 'kaboom',
    });

    consoleError.mockRestore();
  });

  it('recovers when "Try again" is pressed', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    let tree: ReactTestRenderer.ReactTestRenderer;
    let shouldThrow = true;
    function MaybeBomb() {
      if (shouldThrow) {
        throw new Error('kaboom');
      }
      return <Text>recovered</Text>;
    }

    await act(async () => {
      tree = ReactTestRenderer.create(
        <ErrorBoundary>
          <MaybeBomb />
        </ErrorBoundary>,
      );
    });

    shouldThrow = false;
    await act(async () => {
      tree!.root.findByProps({ testID: 'error-boundary-retry' }).props.onPress();
    });

    expect(tree!.root.findAllByType(Text)[0]!.props.children).toBe(
      'recovered',
    );

    consoleError.mockRestore();
  });
});
