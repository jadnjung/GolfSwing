// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/ios/**",
      "**/android/**",
      "**/.expo/**",
      "**/coverage/**",
      // apps/mobile has its own ESLint 8 + @react-native/eslint-config
      // (legacy .eslintrc.js format, React Native-specific rules) — linted
      // via its own `pnpm --filter @golf-swing/mobile run lint`, not this
      // flat config.
      "apps/mobile/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
