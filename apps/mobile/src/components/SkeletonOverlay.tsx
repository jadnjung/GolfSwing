import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { PoseFrame } from '@golf-swing/domain';
import { SKELETON_CONNECTIONS } from '@golf-swing/domain';
import { colors } from '../theme/theme';

interface SkeletonOverlayProps {
  landmarks: PoseFrame;
  width: number;
  height: number;
  // PRD 5.2 POSE-005: low-confidence landmarks shouldn't be drawn as if
  // they were reliable. Matches analysis-engine's DEFAULT_MIN_CONFIDENCE —
  // duplicated as a literal rather than imported, since this is a rendering
  // concern (skip drawing) not a calculation concern (reject outright), and
  // the two callers are allowed to diverge on this threshold later.
  minConfidence?: number;
}

// Checklist.md MVP item 10 (pose skeleton overlay). Not wired into any
// screen yet — there's no pose-inference pipeline producing real
// PoseFrame data until Phase 2 (blocked on ADR 0014's real-device
// benchmarking), and rendering it against fake data on a real screen would
// mislead the user into thinking pose analysis already works. This exists
// as a ready, tested building block for whenever ReplayScreen (or a future
// results screen) has real landmarks to pass in.
//
// Renders landmarks as an absolutely-positioned SVG overlay, coordinates
// scaled from PoseFrame's normalized [0, 1] space to the given
// width/height — the caller is responsible for sizing/positioning this to
// exactly overlay the video it corresponds to (matching react-native-video's
// rendered dimensions, not the source video's native resolution).
export function SkeletonOverlay({
  landmarks,
  width,
  height,
  minConfidence = 0.5,
}: SkeletonOverlayProps) {
  const isConfident = (name: keyof PoseFrame) => {
    const landmark = landmarks[name];
    return landmark != null && landmark.confidence >= minConfidence;
  };

  return (
    <Svg
      width={width}
      height={height}
      style={styles.overlay}
      testID="skeleton-overlay"
      pointerEvents="none"
    >
      {SKELETON_CONNECTIONS.filter(
        ([from, to]) => isConfident(from) && isConfident(to),
      ).map(([from, to]) => {
        const fromPoint = landmarks[from]!;
        const toPoint = landmarks[to]!;
        return (
          <Line
            key={`${from}-${to}`}
            x1={fromPoint.x * width}
            y1={fromPoint.y * height}
            x2={toPoint.x * width}
            y2={toPoint.y * height}
            stroke={colors.primary}
            strokeWidth={2}
            testID="skeleton-bone"
          />
        );
      })}
      {(Object.keys(landmarks) as (keyof PoseFrame)[])
        .filter(isConfident)
        .map(name => {
          const point = landmarks[name]!;
          return (
            <Circle
              key={name}
              cx={point.x * width}
              cy={point.y * height}
              r={4}
              fill={colors.primary}
              testID="skeleton-joint"
            />
          );
        })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
