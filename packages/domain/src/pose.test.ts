import { POSE_LANDMARK_NAMES, SKELETON_CONNECTIONS, type PoseLandmarkName } from "./pose";

describe("SKELETON_CONNECTIONS", () => {
  it("only references known landmark names", () => {
    const knownNames = new Set<PoseLandmarkName>(POSE_LANDMARK_NAMES);
    for (const [from, to] of SKELETON_CONNECTIONS) {
      expect(knownNames.has(from)).toBe(true);
      expect(knownNames.has(to)).toBe(true);
    }
  });

  it("never connects a landmark to itself", () => {
    for (const [from, to] of SKELETON_CONNECTIONS) {
      expect(from).not.toBe(to);
    }
  });

  it("has no duplicate connections, in either direction", () => {
    const seen = new Set<string>();
    for (const [from, to] of SKELETON_CONNECTIONS) {
      const key = [from, to].sort().join("-");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("touches every landmark at least once", () => {
    // Not a hard requirement of the type system, but an isolated landmark
    // would silently never get drawn as part of any bone - worth catching.
    const touched = new Set<PoseLandmarkName>();
    for (const [from, to] of SKELETON_CONNECTIONS) {
      touched.add(from);
      touched.add(to);
    }
    for (const name of POSE_LANDMARK_NAMES) {
      expect(touched.has(name)).toBe(true);
    }
  });
});
