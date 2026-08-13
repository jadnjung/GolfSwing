// PRD section 5.2 (POSE-002) and docs/architecture/swing-angle-definitions.md
// — the same model-independent landmark set that document already defines
// for angle formulas, promoted here to a shared type so the skeleton
// overlay (Checklist.md MVP item 10) and analysis-engine's angle formulas
// (PRD 5.3) agree on one vocabulary rather than each inventing their own.
// No pose-inference library is chosen yet (ADR 0009) — this happens to
// match MediaPipe BlazePose's 33-point topology (PRD 5.2's suggested
// starting candidate) but isn't tied to it.
export const POSE_LANDMARK_NAMES = [
  "nose",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftIndex",
  "rightIndex",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
  "leftHeel",
  "rightHeel",
  "leftFootIndex",
  "rightFootIndex",
] as const;

export type PoseLandmarkName = (typeof POSE_LANDMARK_NAMES)[number];

// Normalized to [0, 1] against the source frame's width/height, not pixel
// coordinates — matches how every pose-inference library in this space
// (MediaPipe included) reports landmark position, and lets a renderer scale
// to whatever size it's actually displayed at without knowing the source
// video's resolution.
export interface PoseLandmark {
  x: number;
  y: number;
  confidence: number;
}

// One frame's worth of landmarks. Partial, not Record<PoseLandmarkName, ...>
// — POSE-002 already says some landmarks (heel, foot index, fingertip) are
// "where supported," so a real model's output may not populate every name
// every frame, and this type should say that rather than forcing every
// caller to invent a synthetic zero-confidence placeholder for landmarks
// the model just didn't report.
export type PoseFrame = Partial<Record<PoseLandmarkName, PoseLandmark>>;

// Bone pairs for a skeleton overlay — which landmark pairs get a line drawn
// between them. Deliberately excludes the hip/shoulder "crossbar" pairs
// (leftHip-rightHip, leftShoulder-rightShoulder) from being drawn twice via
// two different paths; each appears exactly once below.
export const SKELETON_CONNECTIONS: ReadonlyArray<readonly [PoseLandmarkName, PoseLandmarkName]> = [
  // Head
  ["nose", "leftShoulder"],
  ["nose", "rightShoulder"],
  // Arms
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  ["leftWrist", "leftIndex"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
  ["rightWrist", "rightIndex"],
  // Shoulder line
  ["leftShoulder", "rightShoulder"],
  // Torso
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],
  // Hip line
  ["leftHip", "rightHip"],
  // Legs
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["leftAnkle", "leftHeel"],
  ["leftHeel", "leftFootIndex"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
  ["rightAnkle", "rightHeel"],
  ["rightHeel", "rightFootIndex"],
];
