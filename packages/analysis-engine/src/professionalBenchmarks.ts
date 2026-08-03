// PRD section 5.9 "Professional Swing Comparison" and section 22 item 7
// (unresolved: which professional swing footage can be licensed). This
// module sidesteps that open licensing question entirely: rather than
// comparing against actual professional video, it compares a computed
// swing metric against published ranges from peer-reviewed, CC-BY-licensed
// golf biomechanics research. See
// docs/architecture/professional-swing-benchmarks.md for the full research
// writeup, caveats, and what this does/doesn't unlock.
//
// Every range below is a [low, high] band, not a precise target — PRD 19
// Risk 1 ("pose estimates appear more precise than they are") applies just
// as much to citing someone else's research as to this app's own pose
// output. Where a cited paper reports a mean ± standard deviation rather
// than an explicit range, the band here is mean ± 1 SD, rounded to one
// decimal place — a conventional "typical range" reading of that
// statistic, not a claim the paper itself states as a range.
export interface ProfessionalBenchmark {
  /** Low end of the typical professional range, in `unit`. */
  low: number;
  /** High end of the typical professional range, in `unit`. */
  high: number;
  unit: string;
  /** Citation for the source study — surface this alongside any comparison shown to a user, not just the numbers. */
  source: string;
}

export const X_FACTOR_DEGREES: ProfessionalBenchmark = {
  low: 42,
  high: 48,
  unit: "degrees",
  source:
    "Bell et al., \"Golf Swing Biomechanics: A Systematic Review and Methodological Recommendations for Kinematics,\" Sports 2022 (CC BY); Titleist Performance Institute",
};

export const DOWNSWING_TEMPO_SECONDS: ProfessionalBenchmark = {
  low: 0.27,
  high: 0.35,
  unit: "seconds",
  source:
    "Bell et al., \"Golf Swing Biomechanics: A Systematic Review and Methodological Recommendations for Kinematics,\" Sports 2022 (CC BY) — professional males, driver, 0.31s ± 0.04s",
};

export const CLUBHEAD_SPEED_DRIVER_MPS: ProfessionalBenchmark = {
  low: 48.0,
  high: 52.2,
  unit: "meters/second",
  source:
    "Bell et al., \"Golf Swing Biomechanics: A Systematic Review and Methodological Recommendations for Kinematics,\" Sports 2022 (CC BY) — professional males, driver, 50.1 m/s ± 2.1 m/s",
};

export const HIP_ROTATION_LEAD_DEGREES: ProfessionalBenchmark = {
  low: 45,
  high: 55,
  unit: "degrees",
  source:
    "Bell et al., \"Golf Swing Biomechanics: A Systematic Review and Methodological Recommendations for Kinematics,\" Sports 2022 (CC BY) — elite reference, lead-side hip internal/external rotation, ~50°",
};

export const SHOULDER_ELEVATION_LEAD_DEGREES: ProfessionalBenchmark = {
  low: 90,
  high: 110,
  unit: "degrees",
  source:
    "Bell et al., \"Golf Swing Biomechanics: A Systematic Review and Methodological Recommendations for Kinematics,\" Sports 2022 (CC BY) — elite reference, lead-side shoulder elevation, ~100°",
};

export type BenchmarkComparison = "below" | "within" | "above";

/**
 * Compares a computed swing metric against a published professional
 * benchmark range. Returns which side of the range the value falls on, not
 * a judgment of "good" or "bad" — several benchmarks in this module (e.g.
 * X-Factor, tempo) have professionals on the *lower* end relative to
 * amateurs, so "above" is not inherently better. Presentation of what a
 * result means is a UI/feedback-rule concern (PRD 18: still needs
 * golf-domain reviewer approval), not this function's job.
 */
export function compareToProfessionalBenchmark(
  value: number,
  benchmark: ProfessionalBenchmark,
): BenchmarkComparison {
  if (value < benchmark.low) {
    return "below";
  }
  if (value > benchmark.high) {
    return "above";
  }
  return "within";
}
