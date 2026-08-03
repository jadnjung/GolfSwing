import {
  DocumentDirectoryPath,
  readDir,
  readFile,
} from '@dr.pogodin/react-native-fs';
import { parseSwingManifest, type Swing } from '@golf-swing/domain';

export const SWINGS_ROOT = `${DocumentDirectoryPath}/swings`;

/** Path to a saved swing's source video, per the layout RecordScreen writes. */
export function swingVideoPath(swingId: string): string {
  return `${SWINGS_ROOT}/${swingId}/source.mp4`;
}

/**
 * Lists saved swings, newest first, by scanning the swings directory and
 * parsing each analysis-manifest.json (see docs/adr/0006-defer-sqlite.md for
 * why this isn't a database query). A directory with a missing or corrupt
 * manifest is skipped, not allowed to fail the whole listing.
 */
export async function listSwings(): Promise<Swing[]> {
  let entries;
  try {
    entries = await readDir(SWINGS_ROOT);
  } catch {
    // Swings directory doesn't exist yet — no swings recorded, not an error.
    return [];
  }

  const swings: Swing[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    try {
      const manifestRaw = await readFile(
        `${entry.path}/analysis-manifest.json`,
      );
      swings.push(parseSwingManifest(JSON.parse(manifestRaw)));
    } catch (error) {
      console.warn(
        `Skipping unreadable swing manifest at ${entry.path}:`,
        error,
      );
    }
  }

  return swings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
