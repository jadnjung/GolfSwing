// PRD section 4.2 steps 7-8 ("Application detects the active swing segment" /
// "Application trims unnecessary video before and after the swing") and
// Checklist.md MVP item 8. Implements approach A from
// docs/architecture/swing-event-detection-feasibility.md: threshold a
// per-frame motion-energy signal against a quiet baseline sampled from the
// start of the clip (the still "address" period before takeaway), rather
// than waiting on Phase 2's pose-landmark pipeline (still blocked on
// docs/adr/0014's real-device benchmarking).
//
// This module only does the numeric segmentation — it deliberately takes a
// plain `number[]` of per-frame motion energy, not raw video frames.
// Producing that signal (decoding frames, computing frame-to-frame pixel
// difference) is a separate, native-video concern belonging to whatever
// calls into this from `apps/mobile`, and isn't implemented here — see the
// feasibility report's "What this report cannot establish" section for why
// this function's actual real-world accuracy is still unvalidated.

export interface SwingSegmentDetectionOptions {
  /**
   * How many leading frames are sampled to establish the "address stillness"
   * baseline. Must be shorter than the clip, since a countdown-into-address
   * period is expected before takeaway (PRD 4.2 step 5's countdown timer).
   * Default: 15 frames (~0.5s at 30fps) — a placeholder, not validated
   * against real footage.
   */
  baselineWindowFrames?: number;
  /**
   * How far above the baseline (in standard deviations of the baseline
   * window) a frame's motion energy must rise to count as "swing motion"
   * rather than noise. Default: 3 — a placeholder, not validated.
   */
  thresholdMultiplier?: number;
  /**
   * Consecutive below-threshold frames required after the swing starts
   * before the segment is considered finished (follow-through has settled).
   * Prevents a single quiet frame mid-swing from ending the segment early.
   * Default: 10 frames.
   */
  minSettleFrames?: number;
  /**
   * Extra frames included before the detected start and after the detected
   * end, since motion-energy onset lags the true takeaway/finish slightly.
   * Default: 5 frames on each side.
   */
  paddingFrames?: number;
}

export interface SwingSegmentResult {
  startFrameIndex: number;
  endFrameIndex: number;
}

const DEFAULT_OPTIONS: Required<SwingSegmentDetectionOptions> = {
  baselineWindowFrames: 15,
  thresholdMultiplier: 3,
  minSettleFrames: 10,
  paddingFrames: 5,
};

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], meanValue: number): number {
  const variance = values.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Finds the [startFrameIndex, endFrameIndex] window containing the active
 * swing, given a per-frame motion-energy time series (one non-negative
 * number per frame, in whatever units the caller's motion-energy function
 * produces — this only cares about relative magnitude).
 *
 * Returns `null` when no frame's motion energy clears the baseline
 * threshold at all (e.g. a static clip, or a baseline window so noisy the
 * threshold can't be established) — callers should fall back to the full,
 * untrimmed clip in that case rather than guessing a segment, matching the
 * feasibility report's "do not claim automatic trimming works" caution.
 */
export function detectActiveSwingSegment(
  motionEnergyPerFrame: number[],
  options: SwingSegmentDetectionOptions = {},
): SwingSegmentResult | null {
  const { baselineWindowFrames, thresholdMultiplier, minSettleFrames, paddingFrames } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (motionEnergyPerFrame.length === 0) {
    return null;
  }

  const baselineFrameCount = Math.min(baselineWindowFrames, motionEnergyPerFrame.length);
  const baselineWindow = motionEnergyPerFrame.slice(0, baselineFrameCount);
  const baselineMean = mean(baselineWindow);
  const baselineStdDev = standardDeviation(baselineWindow, baselineMean);
  const threshold = baselineMean + thresholdMultiplier * baselineStdDev;

  const startFrameIndex = motionEnergyPerFrame.findIndex((energy) => energy > threshold);
  if (startFrameIndex === -1) {
    return null;
  }

  // Scan forward from the start for the first point where motion has
  // stayed below threshold for `minSettleFrames` in a row - that's the end
  // of the active segment. If it never settles, the segment runs to the
  // end of the clip rather than being treated as a detection failure -
  // an unsettled tail is still a usable (if untrimmed-at-the-end) segment.
  let endFrameIndex = motionEnergyPerFrame.length - 1;
  let consecutiveQuietFrames = 0;
  for (let i = startFrameIndex + 1; i < motionEnergyPerFrame.length; i++) {
    if (motionEnergyPerFrame[i]! <= threshold) {
      consecutiveQuietFrames++;
      if (consecutiveQuietFrames >= minSettleFrames) {
        endFrameIndex = i - consecutiveQuietFrames;
        break;
      }
    } else {
      consecutiveQuietFrames = 0;
    }
  }

  const lastFrameIndex = motionEnergyPerFrame.length - 1;
  return {
    startFrameIndex: Math.max(0, startFrameIndex - paddingFrames),
    endFrameIndex: Math.min(lastFrameIndex, endFrameIndex + paddingFrames),
  };
}
