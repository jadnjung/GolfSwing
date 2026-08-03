import { exists, readFile, writeFile } from '@dr.pogodin/react-native-fs';
import {
  DIAGNOSTIC_LOG_PATH,
  appendDiagnosticLog,
  readDiagnosticLog,
} from './diagnosticLog';

const mockedExists = exists as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedWriteFile = writeFile as jest.Mock;

describe('appendDiagnosticLog', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes a single entry to a new log file', async () => {
    mockedExists.mockResolvedValue(false);

    await appendDiagnosticLog({ level: 'error', message: 'boom' });

    expect(mockedWriteFile).toHaveBeenCalledTimes(1);
    const [path, content] = mockedWriteFile.mock.calls[0];
    expect(path).toBe(DIAGNOSTIC_LOG_PATH);
    const entry = JSON.parse(content.trim());
    expect(entry).toMatchObject({ level: 'error', message: 'boom' });
    expect(typeof entry.timestamp).toBe('string');
  });

  it('appends to existing entries', async () => {
    mockedExists.mockResolvedValue(true);
    mockedReadFile.mockResolvedValue(
      `${JSON.stringify({ timestamp: 't0', level: 'warn', message: 'first' })}\n`,
    );

    await appendDiagnosticLog({ level: 'error', message: 'second' });

    const [, content] = mockedWriteFile.mock.calls[0];
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).message).toBe('first');
    expect(JSON.parse(lines[1]!).message).toBe('second');
  });

  it('drops the oldest entries once the cap is exceeded', async () => {
    mockedExists.mockResolvedValue(true);
    const existingLines = Array.from({ length: 500 }, (_, i) =>
      JSON.stringify({
        timestamp: `t${i}`,
        level: 'info',
        message: `msg-${i}`,
      }),
    );
    mockedReadFile.mockResolvedValue(`${existingLines.join('\n')}\n`);

    await appendDiagnosticLog({ level: 'error', message: 'newest' });

    const [, content] = mockedWriteFile.mock.calls[0];
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(500);
    expect(JSON.parse(lines[0]!).message).toBe('msg-1');
    expect(JSON.parse(lines[lines.length - 1]!).message).toBe('newest');
  });

  it('does not throw when the underlying write fails', async () => {
    mockedExists.mockResolvedValue(false);
    mockedWriteFile.mockRejectedValue(new Error('disk full'));

    await expect(
      appendDiagnosticLog({ level: 'error', message: 'boom' }),
    ).resolves.toBeUndefined();
  });
});

describe('readDiagnosticLog', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list when no log file exists', async () => {
    mockedExists.mockResolvedValue(false);
    await expect(readDiagnosticLog()).resolves.toEqual([]);
  });

  it('parses each logged line', async () => {
    mockedExists.mockResolvedValue(true);
    mockedReadFile.mockResolvedValue(
      `${JSON.stringify({ timestamp: 't0', level: 'error', message: 'a' })}\n${JSON.stringify(
        { timestamp: 't1', level: 'warn', message: 'b' },
      )}\n`,
    );

    const entries = await readDiagnosticLog();
    expect(entries.map(entry => entry.message)).toEqual(['a', 'b']);
  });
});
