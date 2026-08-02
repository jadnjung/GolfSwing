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

  const MockCamera = React.forwardRef((props, ref) =>
    React.createElement(View, {
      ...props,
      ref,
      testID: props.testID ?? 'mock-camera',
    }),
  );
  MockCamera.displayName = 'Camera';
  MockCamera.getCameraPermissionStatus = jest.fn(() => 'not-determined');
  MockCamera.getMicrophonePermissionStatus = jest.fn(() => 'not-determined');
  MockCamera.requestCameraPermission = jest.fn(async () => 'denied');
  MockCamera.requestMicrophonePermission = jest.fn(async () => 'denied');

  return {
    Camera: MockCamera,
    useCameraDevice: jest.fn(() => undefined),
  };
});
