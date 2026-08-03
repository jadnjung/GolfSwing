import {
  DEFAULT_MIN_CONFIDENCE,
  InsufficientConfidenceError,
  calculateJointAngleDegrees,
} from "./angle";

function point(
  x: number,
  y: number,
  confidence = 1,
): {
  x: number;
  y: number;
  confidence: number;
} {
  return { x, y, confidence };
}

describe("calculateJointAngleDegrees", () => {
  it("computes a right angle", () => {
    const angle = calculateJointAngleDegrees(point(0, 1), point(0, 0), point(1, 0));
    expect(angle).toBeCloseTo(90);
  });

  it("computes a straight line as 180 degrees", () => {
    const angle = calculateJointAngleDegrees(point(-1, 0), point(0, 0), point(1, 0));
    expect(angle).toBeCloseTo(180);
  });

  it("computes overlapping-direction points as 0 degrees", () => {
    const angle = calculateJointAngleDegrees(point(1, 0), point(0, 0), point(2, 0));
    expect(angle).toBeCloseTo(0);
  });

  it("is unaffected by the absolute scale of the points", () => {
    const small = calculateJointAngleDegrees(point(0, 1), point(0, 0), point(1, 0));
    const large = calculateJointAngleDegrees(point(0, 1000), point(0, 0), point(1000, 0));
    expect(large).toBeCloseTo(small);
  });

  it.each([
    ["A", point(0, 1, 0.1), point(0, 0), point(1, 0)],
    ["B", point(0, 1), point(0, 0, 0.1), point(1, 0)],
    ["C", point(0, 1), point(0, 0), point(1, 0, 0.1)],
  ])("rejects when landmark %s confidence is below the minimum", (_label, a, b, c) => {
    expect(() => calculateJointAngleDegrees(a, b, c)).toThrow(InsufficientConfidenceError);
  });

  it("respects a custom minimum confidence threshold", () => {
    const a = point(0, 1, 0.6);
    const b = point(0, 0, 0.6);
    const c = point(1, 0, 0.6);

    expect(calculateJointAngleDegrees(a, b, c)).toBeCloseTo(90);
    expect(() => calculateJointAngleDegrees(a, b, c, 0.9)).toThrow(InsufficientConfidenceError);
  });

  it("uses 0.5 as the default minimum confidence", () => {
    expect(DEFAULT_MIN_CONFIDENCE).toBe(0.5);
  });

  it("rejects a zero-length segment (joint coincident with a reference point)", () => {
    expect(() => calculateJointAngleDegrees(point(0, 0), point(0, 0), point(1, 0))).toThrow(
      InsufficientConfidenceError,
    );
  });
});
