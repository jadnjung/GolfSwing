# 0012. Tab bar icon library: lucide-react-native 1.28.0

- Status: Accepted
- Date: 2026-08-03

## Context

Step 12's Android emulator run surfaced a real, previously-invisible UX gap: the bottom tab bar showed `@react-navigation/bottom-tabs`' built-in "missing icon" placeholder above every tab label, since `RootNavigator.tsx` had never set `tabBarIcon` on any `Tab.Screen`. Deferred at the time pending a deliberate icon-library choice rather than a rushed pick.

Checked the realistic options:

- **`react-native-vector-icons`** — the long-standing default for this in the RN ecosystem, huge install base. Latest 10.3.0, but last published 2025-07-23 — over a year stale relative to this session. It also requires real native configuration to work: bundling font files and registering them via `Info.plist` (`UIAppFonts`) on iOS and a Gradle font-linking step on Android — native asset work for something that has a simpler alternative below.
- **`@expo/vector-icons`** — requires `expo-font >=14.0.4` as a peer dependency. This project deliberately isn't using managed Expo (PRD 7.4); pulling in an Expo module as a peer for icons alone is an odd, unnecessary coupling.
- **`lucide-react-native`** — actively maintained (latest 1.28.0, released 2026-07-30), SVG-based via `react-native-svg` (itself actively maintained, released 2026-05-20, broad `react: '*'` / `react-native: '*'` peer compatibility — no narrow version window to work around). No native font-linking step: icons render as `react-native-svg` components, which only needs the one native module already used by countless RN libraries.

## Decision

Use **`lucide-react-native` 1.28.0** (backed by `react-native-svg` 15.15.5). Same reasoning pattern as every prior dependency ADR in this project: prefer the actively-maintained option with the least native-configuration surface, since none of this can be build-verified interactively here beyond what a real `pnpm install` + Jest/Metro resolution actually proves.

Icons imported **per-icon via deep import paths** (`lucide-react-native/icons/house`, not `import { House } from 'lucide-react-native'`) — the package's barrel file re-exports its entire ~1600-icon set, and both Jest and Metro have to resolve/transform every one of those files just to pull out the 5 names this app actually uses. Deep imports cut `App.test.tsx`'s run time from ~19s to ~1.6s in this repo (measured directly, not estimated) by only touching the specific icon files needed.

## Consequences

- `RootNavigator.tsx`'s five tabs now render real icons (`House`, `Video`, `Clock`, `Dumbbell`, `Settings`) instead of the "missing icon" placeholder — closing the gap Step 12 surfaced.
- Each `tabBarIcon` is a named, module-scope function component (`HomeTabIcon`, etc.), not an inline arrow function in `options` — avoids `react/no-unstable-nested-components`, a real ESLint warning caught while wiring this up, not a style nitpick added after the fact.
- **Real bug fixed along the way, not by inspection**: `apps/mobile/jest.config.js`'s `transformIgnorePatterns` fix alone wasn't sufficient — `lucide-react-native`'s package.json `exports` map has a `"react-native"` condition pointing straight at its ESM (`.mjs`) build, which RN's own Jest preset resolver honors (matching Metro's real module resolution), but the preset's `transform` map only registers `.js`/`.ts`/`.tsx`, so `.mjs` files hit Jest's CommonJS loader untransformed and failed on `export` syntax regardless of `transformIgnorePatterns`. Fixed by re-declaring the preset's own `transform` entries in this project's `jest.config.js` with `mjs` added — Jest doesn't deep-merge a project's `transform` config with the preset's, so the original entries had to be repeated, not just extended.
- Not build-verified on a real simulator/emulator (both shut down before Step 13, per your instruction) — icon rendering specifically (SVG native view backing) hasn't been visually confirmed on a device the way Steps 11-12's screenshots confirmed other UI.
- If a future icon need (e.g. a custom brand mark) falls outside Lucide's set, that's a separate addition, not a reason to swap this library — Lucide's set is large and general-purpose enough that this is unlikely soon.
