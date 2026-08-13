/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Circle, Line } from 'react-native-svg';
import type { PoseFrame } from '@golf-swing/domain';
import { SkeletonOverlay } from '../src/components/SkeletonOverlay';

const fullBodyLandmarks: PoseFrame = {
  nose: { x: 0.5, y: 0.1, confidence: 0.9 },
  leftShoulder: { x: 0.4, y: 0.2, confidence: 0.9 },
  rightShoulder: { x: 0.6, y: 0.2, confidence: 0.9 },
  leftElbow: { x: 0.3, y: 0.35, confidence: 0.9 },
  rightElbow: { x: 0.7, y: 0.35, confidence: 0.9 },
  leftWrist: { x: 0.25, y: 0.5, confidence: 0.9 },
  rightWrist: { x: 0.75, y: 0.5, confidence: 0.9 },
  leftIndex: { x: 0.24, y: 0.55, confidence: 0.9 },
  rightIndex: { x: 0.76, y: 0.55, confidence: 0.9 },
  leftHip: { x: 0.45, y: 0.55, confidence: 0.9 },
  rightHip: { x: 0.55, y: 0.55, confidence: 0.9 },
  leftKnee: { x: 0.43, y: 0.75, confidence: 0.9 },
  rightKnee: { x: 0.57, y: 0.75, confidence: 0.9 },
  leftAnkle: { x: 0.42, y: 0.95, confidence: 0.9 },
  rightAnkle: { x: 0.58, y: 0.95, confidence: 0.9 },
  leftHeel: { x: 0.4, y: 0.97, confidence: 0.9 },
  rightHeel: { x: 0.6, y: 0.97, confidence: 0.9 },
  leftFootIndex: { x: 0.38, y: 0.99, confidence: 0.9 },
  rightFootIndex: { x: 0.62, y: 0.99, confidence: 0.9 },
};

// react-native-svg's <Svg> schedules work (layout/measurement) past the
// initial synchronous render - without flushing a tick inside act(), Jest
// tears down the test environment before that work runs and every test
// fails with "trying to import a file after the Jest environment has been
// torn down."
async function renderOverlay(
  props: React.ComponentProps<typeof SkeletonOverlay>,
): Promise<ReactTestRenderer.ReactTestRenderer> {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<SkeletonOverlay {...props} />);
    await new Promise<void>(resolve => setImmediate(() => resolve()));
  });
  return tree;
}

describe('SkeletonOverlay', () => {
  it('draws a joint for every confident landmark', async () => {
    const tree = await renderOverlay({
      landmarks: fullBodyLandmarks,
      width: 300,
      height: 600,
    });

    expect(tree.root.findAllByType(Circle)).toHaveLength(
      Object.keys(fullBodyLandmarks).length,
    );
  });

  it('draws a bone for every connection whose endpoints are both confident', async () => {
    const tree = await renderOverlay({
      landmarks: fullBodyLandmarks,
      width: 300,
      height: 600,
    });

    // 20 connections defined in SKELETON_CONNECTIONS (packages/domain).
    expect(tree.root.findAllByType(Line)).toHaveLength(20);
  });

  it('scales normalized landmark coordinates to the given pixel dimensions', async () => {
    const tree = await renderOverlay({
      landmarks: fullBodyLandmarks,
      width: 300,
      height: 600,
    });

    const [joint] = tree.root.findAllByType(Circle);
    // nose: x: 0.5, y: 0.1 -> (150, 60) at 300x600.
    expect(joint!.props.cx).toBeCloseTo(150);
    expect(joint!.props.cy).toBeCloseTo(60);
  });

  it('omits landmarks below the confidence threshold', async () => {
    const landmarks: PoseFrame = {
      ...fullBodyLandmarks,
      nose: { x: 0.5, y: 0.1, confidence: 0.1 },
    };

    const tree = await renderOverlay({ landmarks, width: 300, height: 600 });

    expect(tree.root.findAllByType(Circle)).toHaveLength(
      Object.keys(fullBodyLandmarks).length - 1,
    );
  });

  it('omits a bone if either endpoint is missing entirely', async () => {
    const withoutLeftElbow: PoseFrame = { ...fullBodyLandmarks };
    delete withoutLeftElbow.leftElbow;

    const tree = await renderOverlay({
      landmarks: withoutLeftElbow,
      width: 300,
      height: 600,
    });

    // Both bones touching leftElbow (leftShoulder-leftElbow,
    // leftElbow-leftWrist) should be gone.
    expect(tree.root.findAllByType(Line)).toHaveLength(18);
  });

  it('renders nothing when given no landmarks at all', async () => {
    const tree = await renderOverlay({
      landmarks: {},
      width: 300,
      height: 600,
    });

    expect(tree.root.findAllByType(Circle)).toHaveLength(0);
    expect(tree.root.findAllByType(Line)).toHaveLength(0);
  });
});
