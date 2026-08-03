/* eslint-env jest */
// react-native-safe-area-context needs real layout measurement to resolve
// insets, which never happens under react-test-renderer — without this,
// SafeAreaProvider renders its children as null forever. The library ships
// a jest mock for exactly this (see its README's "Mocking" section) that
// provides fixed metrics instead of waiting on native measurement.
jest.mock(
  'react-native-safe-area-context',
  () =>
    // The mock file is authored as `export default {...}`; a plain require()
    // of the Babel-compiled output returns the CJS wrapper ({ default: ... }),
    // not the object itself, which would make every named import undefined.
    require('react-native-safe-area-context/jest/mock').default,
);

// react-native-vision-camera ships no Jest mock for either 4.x or 5.x — its
// Camera component and permission checks are backed entirely by native code.
// Mock just the surface RecordScreen actually uses; tests override the
// jest.fn() return values per-case (not-determined -> request -> granted).
jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  // startRecording/stopRecording are instance methods called via a ref
  // (camera.current.startRecording(...)), not statics on Camera itself, so
  // they're exposed through useImperativeHandle — and also attached directly
  // to MockCamera so tests can configure/assert them without needing a live
  // ref instance.
  const mockStartRecording = jest.fn();
  const mockStopRecording = jest.fn(async () => {});

  const MockCamera = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      pauseRecording: jest.fn(async () => {}),
      resumeRecording: jest.fn(async () => {}),
      cancelRecording: jest.fn(async () => {}),
    }));
    return React.createElement(View, {
      ...props,
      testID: props.testID ?? 'mock-camera',
    });
  });
  MockCamera.displayName = 'Camera';
  MockCamera.getCameraPermissionStatus = jest.fn(() => 'not-determined');
  MockCamera.getMicrophonePermissionStatus = jest.fn(() => 'not-determined');
  MockCamera.requestCameraPermission = jest.fn(async () => 'denied');
  MockCamera.requestMicrophonePermission = jest.fn(async () => 'denied');
  MockCamera.mockStartRecording = mockStartRecording;
  MockCamera.mockStopRecording = mockStopRecording;

  return {
    Camera: MockCamera,
    useCameraDevice: jest.fn(() => undefined),
  };
});

// react-native-video ships no Jest mock — its playback is entirely
// native-backed. Mock just the surface ReplayScreen actually uses; tests
// invoke onLoad/onError directly to drive the loading/ready/error states.
jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  // Exposed as a static (mirroring MockCamera's pattern above) so tests can
  // assert what a frame-step button actually seeked to.
  const mockSeek = jest.fn();

  const MockVideo = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      seek: mockSeek,
      resume: jest.fn(),
      pause: jest.fn(),
    }));
    return React.createElement(View, {
      ...props,
      testID: props.testID ?? 'mock-video',
    });
  });
  MockVideo.displayName = 'Video';
  MockVideo.mockSeek = mockSeek;

  return { __esModule: true, default: MockVideo };
});

// react-native-share ships no Jest mock — its share sheet is entirely
// native-backed. Tests configure open()'s resolved/rejected value per case
// (success, user-cancelled, genuine failure).
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {
    open: jest.fn(async () => ({ success: true })),
  },
}));

// @dr.pogodin/react-native-fs is entirely native-backed; mock just the
// functions RecordScreen actually calls. Resolve successfully by default —
// tests override per-case for failure scenarios.
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  mkdir: jest.fn(async () => {}),
  moveFile: jest.fn(async () => {}),
  writeFile: jest.fn(async () => {}),
  readDir: jest.fn(async () => []),
  readFile: jest.fn(async () => '{}'),
  exists: jest.fn(async () => false),
  unlink: jest.fn(async () => {}),
}));
