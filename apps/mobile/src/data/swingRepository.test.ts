import {
  exists,
  moveFile,
  readDir,
  readFile,
  unlink,
  writeFile,
} from '@dr.pogodin/react-native-fs';
import { createThumbnail } from 'react-native-create-thumbnail';
import {
  deleteAllSwings,
  deleteSwing,
  getSwing,
  getSwingSizeBytes,
  getSwingThumbnail,
  getTotalSwingsSizeBytes,
  listSwings,
  setSwingTags,
  swingVideoPath,
} from './swingRepository';

const mockedReadDir = readDir as jest.Mock;
const mockedReadFile = readFile as jest.Mock;
const mockedUnlink = unlink as jest.Mock;
const mockedExists = exists as jest.Mock;
const mockedWriteFile = writeFile as jest.Mock;
const mockedMoveFile = moveFile as jest.Mock;
const mockedCreateThumbnail = createThumbnail as jest.Mock;

function dirEntry(path: string, size = 0) {
  return {
    path,
    name: path.split('/').pop() ?? path,
    size,
    mtime: null,
    ctime: null,
    isDirectory: () => true,
    isFile: () => false,
  };
}

function fileEntry(path: string, size = 0) {
  return {
    ...dirEntry(path, size),
    isDirectory: () => false,
    isFile: () => true,
  };
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

describe('setSwingTags', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rewrites the manifest with the new tags, preserving other fields', async () => {
    mockedReadFile.mockResolvedValue(JSON.stringify(newerManifest));

    await setSwingTags('swing-newer', ['favorite', 'needs work']);

    expect(mockedWriteFile).toHaveBeenCalledWith(
      '/mock/documents/swings/swing-newer/analysis-manifest.json',
      JSON.stringify(
        { ...newerManifest, tags: ['favorite', 'needs work'] },
        null,
        2,
      ),
    );
  });

  it('throws rather than overwriting a corrupt manifest', async () => {
    mockedReadFile.mockResolvedValue('not valid json{{{');
    await expect(setSwingTags('swing-1', ['tag'])).rejects.toThrow();
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });
});

describe('getSwing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reads and parses a single swing manifest', async () => {
    mockedReadFile.mockResolvedValue(JSON.stringify(newerManifest));
    await expect(getSwing('swing-newer')).resolves.toEqual({
      ...newerManifest,
      tags: [],
    });
    expect(mockedReadFile).toHaveBeenCalledWith(
      '/mock/documents/swings/swing-newer/analysis-manifest.json',
    );
  });

  it('throws rather than returning a corrupt manifest', async () => {
    mockedReadFile.mockResolvedValue('not valid json{{{');
    await expect(getSwing('swing-1')).rejects.toThrow();
  });
});

describe('getSwingThumbnail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the cached thumbnail path without regenerating if one already exists', async () => {
    mockedExists.mockResolvedValue(true);
    await expect(getSwingThumbnail('swing-1')).resolves.toBe(
      '/mock/documents/swings/swing-1/thumbnail.jpg',
    );
    expect(mockedCreateThumbnail).not.toHaveBeenCalled();
  });

  it("generates and caches a thumbnail inside the swing's own directory when none exists yet", async () => {
    mockedExists.mockResolvedValue(false);
    mockedCreateThumbnail.mockResolvedValue({
      path: '/mock/cache/generated-thumbnail.jpg',
      size: 1000,
      mime: 'image/jpeg',
      width: 100,
      height: 100,
    });

    await expect(getSwingThumbnail('swing-1')).resolves.toBe(
      '/mock/documents/swings/swing-1/thumbnail.jpg',
    );
    expect(mockedCreateThumbnail).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/mock/documents/swings/swing-1/source.mp4',
      }),
    );
    // Cached inside the swing's own directory, not the thumbnail library's
    // separate cache - specifically so deleteSwing's existing
    // unlink(swingDir) cleans it up too (PRD 9.8, ADR 0015).
    expect(mockedMoveFile).toHaveBeenCalledWith(
      '/mock/cache/generated-thumbnail.jpg',
      '/mock/documents/swings/swing-1/thumbnail.jpg',
    );
  });

  it('returns null (not a throw) if generation fails', async () => {
    mockedExists.mockResolvedValue(false);
    mockedCreateThumbnail.mockRejectedValue(new Error('decode failed'));
    await expect(getSwingThumbnail('swing-1')).resolves.toBeNull();
  });
});

describe('getSwingSizeBytes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sums the size of the files in a swing directory', async () => {
    mockedReadDir.mockResolvedValue([
      fileEntry('/mock/documents/swings/swing-1/source.mp4', 1000),
      fileEntry('/mock/documents/swings/swing-1/analysis-manifest.json', 200),
    ]);
    await expect(getSwingSizeBytes('swing-1')).resolves.toBe(1200);
  });

  it('returns 0 when the swing does not exist', async () => {
    mockedReadDir.mockRejectedValue(new Error('ENOENT'));
    await expect(getSwingSizeBytes('swing-1')).resolves.toBe(0);
  });
});

describe('getTotalSwingsSizeBytes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sums every swing directory', async () => {
    mockedReadDir.mockImplementation(async (path: string) => {
      if (path === '/mock/documents/swings') {
        return [
          dirEntry('/mock/documents/swings/swing-older'),
          dirEntry('/mock/documents/swings/swing-newer'),
        ];
      }
      if (path.includes('swing-older')) {
        return [fileEntry(`${path}/source.mp4`, 500)];
      }
      if (path.includes('swing-newer')) {
        return [fileEntry(`${path}/source.mp4`, 1500)];
      }
      throw new Error(`unexpected readDir: ${path}`);
    });

    await expect(getTotalSwingsSizeBytes()).resolves.toBe(2000);
  });

  it('returns 0 when no swings have been recorded yet', async () => {
    mockedReadDir.mockRejectedValue(new Error('ENOENT'));
    await expect(getTotalSwingsSizeBytes()).resolves.toBe(0);
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
