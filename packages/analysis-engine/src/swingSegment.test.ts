import { detectActiveSwingSegment } from "./swingSegment";

// Synthetic motion-energy time series shaped like a real swing recording:
// a quiet address period, a motion spike through the swing, and a settled
// tail. Frame values are arbitrary units - only relative magnitude matters
// to the algorithm (see swingSegment.ts's module comment on why this
// doesn't take real video frames).
function quietFrames(count: number, value = 1): number[] {
  return new Array(count).fill(value);
}

function swingFrames(count: number, peak = 50): number[] {
  // Ramps up to a peak then back down, roughly shaped like acceleration
  // through backswing/downswing/impact/follow-through.
  return Array.from({ length: count }, (_, i) => {
    const progress = i / (count - 1);
    const bell = Math.sin(progress * Math.PI);
    return 1 + bell * peak;
  });
}

describe("detectActiveSwingSegment", () => {
  it("returns null for an empty motion-energy series", () => {
    expect(detectActiveSwingSegment([])).toBeNull();
  });

  it("returns null when no frame ever rises above the baseline", () => {
    const frames = quietFrames(40);
    expect(detectActiveSwingSegment(frames)).toBeNull();
  });

  it("finds the swing segment between two quiet periods", () => {
    const address = quietFrames(20);
    const swing = swingFrames(20);
    const finish = quietFrames(30);
    const frames = [...address, ...swing, ...finish];

    const result = detectActiveSwingSegment(frames, {
      baselineWindowFrames: 20,
      minSettleFrames: 10,
      paddingFrames: 0,
    });

    expect(result).not.toBeNull();
    // The swing block spans indices 20-39; the ramped shape means detection
    // catches on slightly after the true boundary (the first frame or two
    // is indistinguishable from baseline noise), so this checks it lands
    // close to, not exactly on, the block boundary.
    expect(result!.startFrameIndex).toBeGreaterThanOrEqual(20);
    expect(result!.startFrameIndex).toBeLessThan(25);
    expect(result!.endFrameIndex).toBeGreaterThanOrEqual(35);
    expect(result!.endFrameIndex).toBeLessThan(40 + 30);
  });

  it("applies padding on both sides, clamped to the clip's bounds", () => {
    const address = quietFrames(20);
    const swing = swingFrames(20);
    const finish = quietFrames(30);
    const frames = [...address, ...swing, ...finish];

    const noPadding = detectActiveSwingSegment(frames, { paddingFrames: 0 });
    const padded = detectActiveSwingSegment(frames, { paddingFrames: 5 });

    expect(padded!.startFrameIndex).toBe(Math.max(0, noPadding!.startFrameIndex - 5));
    expect(padded!.endFrameIndex).toBe(Math.min(frames.length - 1, noPadding!.endFrameIndex + 5));
  });

  it("does not let padding push the start below 0 or the end past the last frame", () => {
    // A swing that starts immediately and never settles - padding would
    // otherwise push start negative and end past the array's bounds.
    const frames = swingFrames(15);

    const result = detectActiveSwingSegment(frames, {
      baselineWindowFrames: 3,
      paddingFrames: 10,
    });

    expect(result).not.toBeNull();
    expect(result!.startFrameIndex).toBeGreaterThanOrEqual(0);
    expect(result!.endFrameIndex).toBeLessThanOrEqual(frames.length - 1);
  });

  it("runs the segment to the end of the clip if motion never settles again", () => {
    const address = quietFrames(20);
    // Motion stays elevated all the way to the last frame - no settle
    // window is ever satisfied.
    const risingAndStaying = Array.from({ length: 20 }, (_, i) => 10 + i);
    const frames = [...address, ...risingAndStaying];

    const result = detectActiveSwingSegment(frames, {
      baselineWindowFrames: 20,
      minSettleFrames: 10,
      paddingFrames: 0,
    });

    expect(result).not.toBeNull();
    expect(result!.endFrameIndex).toBe(frames.length - 1);
  });

  it("treats a single-frame settle requirement as ending on the first quiet frame", () => {
    const address = quietFrames(10);
    const swing = swingFrames(10);
    const finish = quietFrames(10);
    const frames = [...address, ...swing, ...finish];

    const result = detectActiveSwingSegment(frames, {
      baselineWindowFrames: 10,
      minSettleFrames: 1,
      paddingFrames: 0,
    });

    expect(result).not.toBeNull();
    expect(result!.endFrameIndex).toBeLessThan(20);
  });
});
