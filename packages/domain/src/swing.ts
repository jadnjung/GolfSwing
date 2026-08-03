import type { Handedness } from "./profile";

// Matches the fields RecordScreen actually writes to analysis-manifest.json
// today (see apps/mobile/src/screens/RecordScreen.tsx). Not the full PRD
// section 7.7 Swing model — fields like poseModelVersion or qualityScore get
// added here once something actually produces them.
export type ClubType = "driver" | "iron" | "wedge" | "putter";
export type CameraView = "down-the-line" | "face-on";
export type CameraPosition = "front" | "back";
export type AnalysisStatus = "pending";

export interface Swing {
  id: string;
  createdAt: string;
  clubType: ClubType;
  cameraView: CameraView;
  cameraPosition: CameraPosition;
  frameRate: number;
  durationMs: number;
  analysisStatus: AnalysisStatus;
  // From the user's profile at record time (docs/architecture/
  // swing-angle-definitions.md's "Open gaps" section: several PRD 5.3
  // metrics like lead/trail elbow are undefined without it).
  handedness: Handedness;
}

// Exported for packages/domain/src/profile.ts's primaryClub validation —
// one club-type vocabulary, not two independently maintained lists.
export const CLUB_TYPES: readonly ClubType[] = ["driver", "iron", "wedge", "putter"];
const CAMERA_VIEWS: readonly CameraView[] = ["down-the-line", "face-on"];
const CAMERA_POSITIONS: readonly CameraPosition[] = ["front", "back"];
const HANDEDNESS_VALUES: readonly Handedness[] = ["left", "right"];

export class InvalidSwingManifestError extends Error {
  constructor(reason: string) {
    super(`Invalid swing manifest: ${reason}`);
    this.name = "InvalidSwingManifestError";
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Parses and validates a swing's analysis-manifest.json content. Throws
 * InvalidSwingManifestError rather than silently accepting malformed or
 * partial data — a corrupt manifest should be skipped by the caller, not
 * surfaced as a swing with made-up defaults.
 */
export function parseSwingManifest(raw: unknown): Swing {
  if (typeof raw !== "object" || raw === null) {
    throw new InvalidSwingManifestError("not an object");
  }

  const manifest = raw as Record<string, unknown>;

  if (!isNonEmptyString(manifest.id)) {
    throw new InvalidSwingManifestError('missing or invalid "id"');
  }
  if (!isNonEmptyString(manifest.createdAt) || Number.isNaN(Date.parse(manifest.createdAt))) {
    throw new InvalidSwingManifestError('missing or invalid "createdAt"');
  }
  if (!CLUB_TYPES.includes(manifest.clubType as ClubType)) {
    throw new InvalidSwingManifestError('missing or invalid "clubType"');
  }
  if (!CAMERA_VIEWS.includes(manifest.cameraView as CameraView)) {
    throw new InvalidSwingManifestError('missing or invalid "cameraView"');
  }
  if (!CAMERA_POSITIONS.includes(manifest.cameraPosition as CameraPosition)) {
    throw new InvalidSwingManifestError('missing or invalid "cameraPosition"');
  }
  if (typeof manifest.frameRate !== "number" || manifest.frameRate <= 0) {
    throw new InvalidSwingManifestError('missing or invalid "frameRate"');
  }
  if (typeof manifest.durationMs !== "number" || manifest.durationMs < 0) {
    throw new InvalidSwingManifestError('missing or invalid "durationMs"');
  }
  if (manifest.analysisStatus !== "pending") {
    throw new InvalidSwingManifestError('missing or invalid "analysisStatus"');
  }
  if (!HANDEDNESS_VALUES.includes(manifest.handedness as Handedness)) {
    throw new InvalidSwingManifestError('missing or invalid "handedness"');
  }

  return {
    id: manifest.id,
    createdAt: manifest.createdAt,
    clubType: manifest.clubType as ClubType,
    cameraView: manifest.cameraView as CameraView,
    cameraPosition: manifest.cameraPosition as CameraPosition,
    frameRate: manifest.frameRate,
    durationMs: manifest.durationMs,
    analysisStatus: "pending",
    handedness: manifest.handedness as Handedness,
  };
}
