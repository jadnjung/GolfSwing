import { exists, readDir, readFile, unlink } from '@dr.pogodin/react-native-fs';
import {
  deleteAllSwings,
  deleteSwing,
  listSwings,
  swingVideoPath,
} from './swingRepository';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedUnlink = unlink as jest.Mock;
const mockedExists = exists as jest.Mock;

function dirEntry(path: string) {
  return {
    path,
    name: path.split('/').pop() ?? path,
    size: 0,
    mtime: null,
    ctime: null,
    isDirectory: () => true,
    isFile: () => false,
  };
}

function fileEntry(path: string) {
  return { ...dirEntry(path), isDirectory: () => false, isFile: () => true };
}

const olderManifest = {
  id: 'swing-older',
  createdAt: '2026-08-01T00:00:00.000Z',
  clubType: 'iron',
  cameraView: 'down-the-line',
  cameraPosition: 'back',
  frameRate: 30,
  durationMs: 3000,
  analysisStatus: 'pending',
  handedness: 'right',
};

const newerManifest = {
  id: 'swing-newer',
  createdAt: '2026-08-02T00:00:00.000Z',
  clubType: 'driver',
  cameraView: 'face-on',
  cameraPosition: 'front',
  frameRate: 60,
  durationMs: 4000,
  analysisStatus: 'pending',
  handedness: 'right',
};

describe('swingVideoPath', () => {
  it('builds the source video path for a swing id', () => {
    expect(swingVideoPath('swing-1')).toBe(
      '/mock/documents/swings/swing-1/source.mp4',
    );
  });
});

describe('deleteSwing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("unlinks the swing's whole directory", async () => {
    await deleteSwing('swing-1');
    expect(mockedUnlink).toHaveBeenCalledWith('/mock/documents/swings/swing-1');
  });

  it('propagates a failure rather than swallowing it', async () => {
    mockedUnlink.mockRejectedValue(new Error('permission denied'));
    await expect(deleteSwing('swing-1')).rejects.toThrow('permission denied');
  });
});

describe('deleteAllSwings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('unlinks the whole swings root when it exists', async () => {
    mockedExists.mockResolvedValue(true);
    mockedUnlink.mockResolvedValue(undefined);
    await deleteAllSwings();
    expect(mockedUnlink).toHaveBeenCalledWith('/mock/documents/swings');
  });

  it('is a no-op when no swings have been recorded yet', async () => {
    mockedExists.mockResolvedValue(false);
    await deleteAllSwings();
    expect(mockedUnlink).not.toHaveBeenCalled();
  });
});

describe('listSwings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list when the swings directory does not exist yet', async () => {
    mockedReadDir.mockRejectedValue(new Error('ENOENT'));
    await expect(listSwings()).resolves.toEqual([]);
  });

  it('skips non-directory entries and directories with a corrupt manifest, sorted newest first', async () => {
    mockedReadDir.mockResolvedValue([
      dirEntry('/mock/documents/swings/swing-older'),
      dirEntry('/mock/documents/swings/swing-newer'),
      dirEntry('/mock/documents/swings/swing-corrupt'),
      fileEntry('/mock/documents/swings/.DS_Store'),
    ]);
    mockedReadFile.mockImplementation(async (path: string) => {
      if (path.includes('swing-older')) return JSON.stringify(olderManifest);
      if (path.includes('swing-newer')) return JSON.stringify(newerManifest);
      if (path.includes('swing-corrupt')) return 'not valid json{{{';
      throw new Error(`unexpected read: ${path}`);
    });

    const swings = await listSwings();

    expect(swings.map(swing => swing.id)).toEqual([
      'swing-newer',
      'swing-older',
    ]);
    expect(mockedReadFile).not.toHaveBeenCalledWith(
      expect.stringContaining('.DS_Store'),
    );
  });
});
