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
