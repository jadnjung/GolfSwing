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
  'react-native-svg',
  'lucide-react-native',
  'react-native-create-thumbnail',
];

module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(${modulesToTransform.join('|')})/)`,
  ],
  // lucide-react-native's package.json "exports" map has a "react-native"
  // condition pointing straight at its ESM (.mjs) build — RN's jest preset
  // resolver honors that condition (matching Metro's real behavior), but
  // the preset's own `transform` map only registers .js/.ts/.tsx, so .mjs
  // files hit Jest's CommonJS loader untransformed and fail on `export`
  // syntax regardless of transformIgnorePatterns. Re-declare the preset's
  // own transform entries plus `mjs` rather than only adding `mjs` — Jest
  // doesn't deep-merge a project's `transform` with the preset's.
  transform: {
    '^.+\\.(js|ts|tsx|mjs)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      require.resolve('react-native/jest/assetFileTransformer.js'),
  },
  setupFiles: ['./jest.setup.js'],
  // Watchman can hang indefinitely in sandboxed/CI environments without a
  // reachable watchman socket (same issue hit in packages/tooling-smoke-test).
  watchman: false,
};
