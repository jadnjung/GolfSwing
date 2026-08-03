import { writeFile } from '@dr.pogodin/react-native-fs';
import { installGlobalErrorHandler } from './installGlobalErrorHandler';

const mockedWriteFile = writeFile as jest.Mock;

describe('installGlobalErrorHandler', () => {
  const originalErrorUtils = (globalThis as Record<string, unknown>).ErrorUtils;

  afterEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>).ErrorUtils = originalErrorUtils;
  });

  it('does nothing when ErrorUtils is unavailable', () => {
    delete (globalThis as Record<string, unknown>).ErrorUtils;
    expect(() => installGlobalErrorHandler()).not.toThrow();
  });

  it('logs the error locally and still calls the previous handler', async () => {
    const previousHandler = jest.fn();
    let installedHandler: (error: Error, isFatal?: boolean) => void = () => {};

    (globalThis as Record<string, unknown>).ErrorUtils = {
      getGlobalHandler: () => previousHandler,
      setGlobalHandler: (handler: typeof installedHandler) => {
        installedHandler = handler;
      },
    };

    installGlobalErrorHandler();

    const error = new Error('fatal boom');
    installedHandler(error, true);

    // appendDiagnosticLog has several internal await points (mkdir, exists,
    // an optional readFile, writeFile); a plain macrotask flush lets all of
    // them settle before asserting, more reliably than chaining
    // Promise.resolve() a guessed number of times.
    await new Promise<void>(resolve => setImmediate(resolve));

    expect(mockedWriteFile).toHaveBeenCalled();
    const [, content] = mockedWriteFile.mock.calls[0];
    expect(JSON.parse(content.trim())).toMatchObject({
      level: 'error',
      message: 'fatal boom',
    });
    expect(previousHandler).toHaveBeenCalledWith(error, true);
  });
});
