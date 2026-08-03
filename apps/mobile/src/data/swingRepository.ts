import {
  DocumentDirectoryPath,
  exists,
  readDir,
  readFile,
  unlink,
} from '@dr.pogodin/react-native-fs';
import { parseSwingManifest, type Swing } from '@golf-swing/domain';

export const SWINGS_ROOT = `${DocumentDirectoryPath}/swings`;

/** Path to a saved swing's source video, per the layout RecordScreen writes. */
export function swingVideoPath(swingId: string): string {
  return `${SWINGS_ROOT}/${swingId}/source.mp4`;
}

/**
 * Deletes a saved swing's entire directory (source video, manifest, and
 * anything future analysis steps add alongside them) — PRD section 9.8:
 * deleting a swing must remove the original video, thumbnail, pose data,
 * metrics, and feedback together, not just the manifest record.
 */
export async function deleteSwing(swingId: string): Promise<void> {
  await unlink(`${SWINGS_ROOT}/${swingId}`);
}

/**
 * Deletes every saved swing at once — PRD 9.8's "delete-all-data control",
 * distinct from deleting one swing at a time. A no-op (not an error) if
 * the swings directory doesn't exist yet.
 */
export async function deleteAllSwings(): Promise<void> {
  if (await exists(SWINGS_ROOT)) {
    await unlink(SWINGS_ROOT);
  }
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
