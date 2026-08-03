import {
  DocumentDirectoryPath,
  exists,
  readDir,
  readFile,
  unlink,
  writeFile,
} from '@dr.pogodin/react-native-fs';
import { parseSwingManifest, type Swing } from '@golf-swing/domain';

export const SWINGS_ROOT = `${DocumentDirectoryPath}/swings`;

function manifestPath(swingId: string): string {
  return `${SWINGS_ROOT}/${swingId}/analysis-manifest.json`;
}

/** Path to a saved swing's source video, per the layout RecordScreen writes. */
export function swingVideoPath(swingId: string): string {
  return `${SWINGS_ROOT}/${swingId}/source.mp4`;
}

/**
 * Replaces a swing's tags (PRD 5.11) by reading its manifest, parsing and
 * validating it (so a corrupt manifest fails loudly here rather than
 * silently overwriting it with a partial one), and writing it back with
 * only `tags` changed.
 */
export async function setSwingTags(
  swingId: string,
  tags: string[],
): Promise<void> {
  const path = manifestPath(swingId);
  const manifest = parseSwingManifest(JSON.parse(await readFile(path)));
  await writeFile(path, JSON.stringify({ ...manifest, tags }, null, 2));
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
 * Total size of one swing's files (source video + manifest), in bytes —
 * PRD 9.8: deletion confirmations should show the storage this will free.
 * Swing directories are flat (no subdirectories), so a single `readDir`
 * is enough; returns 0 if the swing doesn't exist rather than throwing,
 * since this is informational, not a precondition for deletion.
 */
export async function getSwingSizeBytes(swingId: string): Promise<number> {
  try {
    const entries = await readDir(`${SWINGS_ROOT}/${swingId}`);
    return entries
      .filter(entry => entry.isFile())
      .reduce((total, entry) => total + entry.size, 0);
  } catch {
    return 0;
  }
}

/** Total size of every saved swing combined, in bytes — see getSwingSizeBytes. */
export async function getTotalSwingsSizeBytes(): Promise<number> {
  let entries;
  try {
    entries = await readDir(SWINGS_ROOT);
  } catch {
    return 0;
  }

  let total = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      total += await getSwingSizeBytes(entry.name);
    }
  }
  return total;
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
