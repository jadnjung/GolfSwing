// PRD section 5.3 "Angle calculation". Deliberately just the landmark
// shape this formula needs (a 2D point plus a confidence score) — not the
// full PoseFrame/Landmark domain model (depth, timestamp, frame index),
// since no pose-inference pipeline produces real landmarks yet. Widen this
// once Phase 2's pose-inference library is chosen and produces real data.
export interface AnglePoint {
  x: number;
  y: number;
  confidence: number;
}

export class InsufficientConfidenceError extends Error {
  constructor(reason: string) {
    super(`Cannot calculate joint angle: ${reason}`);
    this.name = "InsufficientConfidenceError";
  }
}

// PRD 5.2 POSE-005 requires warning on low pose confidence but doesn't fix
// a number. 0.5 is a placeholder threshold, not a validated one — revisit
// once real landmark confidence distributions exist from an actual model
// (PRD's Phase 0 "Pose-model benchmark" deliverable).
export const DEFAULT_MIN_CONFIDENCE = 0.5;

/**
 * Angle at joint B formed by points A-B-C, in degrees. Implements PRD
 * 5.3's formula exactly: BA = A-B, BC = C-B, θ = arccos((BA·BC)/(|BA||BC|)),
 * with the cosine input clamped to [-1, 1] (required, since floating-point
 * error can push it fractionally outside that range for near-collinear
 * points, which would otherwise make Math.acos return NaN).
 *
 * Throws InsufficientConfidenceError — rather than returning a degraded or
 * default value — when any landmark's confidence is below minConfidence,
 * or when A/C sit exactly on B (a zero-length segment has no defined
 * direction). PRD 5.3: "Reject calculations with insufficient landmark
 * confidence."
 *
 * This is a 2D estimate. PRD 5.3: "a two-dimensional angle is not
 * necessarily the true three-dimensional joint angle" — labeling a
 * result as estimated is a presentation-layer concern for whatever
 * eventually renders this value, not this function's job.
 */
export function calculateJointAngleDegrees(
  a: AnglePoint,
  b: AnglePoint,
  c: AnglePoint,
  minConfidence: number = DEFAULT_MIN_CONFIDENCE,
): number {
  for (const [label, point] of [
    ["A", a],
    ["B", b],
    ["C", c],
  ] as const) {
    if (point.confidence < minConfidence) {
      throw new InsufficientConfidenceError(
        `landmark ${label} confidence ${point.confidence} is below minimum ${minConfidence}`,
      );
    }
  }

  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const baMagnitude = Math.hypot(baX, baY);
  const bcMagnitude = Math.hypot(bcX, bcY);

  if (baMagnitude === 0 || bcMagnitude === 0) {
    throw new InsufficientConfidenceError(
      "joint and reference landmark are coincident (zero-length segment)",
    );
  }

  const cosine = (baX * bcX + baY * bcY) / (baMagnitude * bcMagnitude);
  const clampedCosine = Math.min(1, Math.max(-1, cosine));

  return (Math.acos(clampedCosine) * 180) / Math.PI;
}
