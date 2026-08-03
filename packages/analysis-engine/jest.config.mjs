/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/**/*.test.ts"],
  // Watchman can hang indefinitely in sandboxed/CI environments without a
  // reachable watchman socket; Jest's own haste-map crawler is fast enough
  // for a workspace this size, so disable the watchman integration.
  watchman: false,
};
