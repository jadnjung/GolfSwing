// RN's own preset ships transformIgnorePatterns that assumes node_modules
// packages live directly under a single "node_modules/" — pnpm nests them
// as "node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>/", which the
// default pattern doesn't match, so RN/Babel-dependent packages get
// skipped and fail on their ESM `import` syntax. This pattern accounts for
// the optional pnpm nesting before checking the package name.
const modulesToTransform = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  '@react-navigation/.*',
  'react-native-safe-area-context',
  'react-native-screens',
];

module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(${modulesToTransform.join('|')})/)`,
  ],
  setupFiles: ['./jest.setup.js'],
  // Watchman can hang indefinitely in sandboxed/CI environments without a
  // reachable watchman socket (same issue hit in packages/tooling-smoke-test).
  watchman: false,
};
