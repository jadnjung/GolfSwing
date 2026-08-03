# Progress Log

Running record of completed work on the Golf Swing App. Updated after every successfully completed task — newest entries at the top. See `docs/PRD.md` for the full spec and `docs/adr/` for architecture decisions.

Entries before 2026-08-02 22:40 KST were backfilled with timestamps from `git log --format=%ai` (the commit that captured that work), not the actual time work started — later entries are timestamped live as the task completes.

---

## 2026-08-03 18:55 KST — Step 18: Side-by-side swing comparison

Picked from the candidates left after Step 17: side-by-side comparison (MVP item 20) over the tab-bar icon gap — the largest remaining MVP-checklist gap, versus a cosmetic fix.

**Scope decision:** PRD 4.4's fuller comparison vision (phase-synchronized playback, skeleton/angle overlays, metric deltas, ghost overlay, saved comparison sessions) all need swing-phase timestamps and pose/metric data that don't exist until Phase 2. Built the honest MVP-item-20-sized version instead: pick two swings, play them independently side by side (stacked vertically — a phone's portrait aspect makes a true horizontal split too narrow to be useful). Recorded this scope boundary directly in `CompareScreen.tsx`'s own comment, not just here, so it's visible to whoever picks up Phase 3's fuller version later.

**Navigation:** extended `HistoryStackParamList` with two new routes — `SelectComparisonSwing: { firstSwingId }` and `Compare: { swingIdA, swingIdB }` — added to the existing `HistoryStackNavigator` alongside `HistoryList`/`Replay`.

**Built:**

- `HistoryScreen`'s row actions gained a "Compare" button (alongside Tags/Delete from Steps 13/15) that navigates to `SelectComparisonSwing` with the tapped swing's id.
- `SelectComparisonSwingScreen`: reuses `swingRepository.listSwings()`, filters out the first swing, and navigates to `Compare` with both ids when a candidate is tapped.
- `CompareScreen`: two independent `<Video controls>` players (reusing the same `react-native-video` dependency and loading/error pattern as `ReplayScreen`), each tracking its own playback state — one video failing to load doesn't affect the other.

**Bug caught by a failing test, not by inspection:** the internal `ComparisonVideo` component initially received a prop literally named `testID` (used both to identify the wrapper and to pass through to the inner `<Video>`). `findByProps({testID: 'compare-video-a'})` in the test then matched *four* elements — the `ComparisonVideo` component itself (which has that prop but no `.source`, since it's the wrapper, not the video), the `Video` mock, and its rendered `View` (composite + host, the familiar double-match pattern from earlier steps) — and grabbed the wrong one first, since `ComparisonVideo`'s own props happened to match too. Fixed by renaming the wrapper's prop to `videoTestID`, so only the actual `<Video testID={...}>` element carries that identifying prop.

**Testing:** new `SelectComparisonSwingScreen.test.tsx` (excludes the first swing from candidates; shows a message when there's nothing else to compare with; navigates to `Compare` with both ids) and `CompareScreen.test.tsx` (each video points at its own swing's file; loading/error states track independently per side). Extended `HistoryScreen.test.tsx` with a case asserting the Compare button navigates correctly.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (71 tests now, up from 65).

**Known open items:**

- Not build-verified on a real simulator/emulator (both shut down before Step 13, per your instruction).
- No phase synchronization, overlays, or metric deltas — genuinely blocked on Phase 2 pose/analysis data, not a scope choice that could be closed with more UI work now.
- The tab-bar icon gap from Step 12 is still the main remaining open item outside Phase 2's own blockers.

## 2026-08-03 18:30 KST — Step 17: Local video export

Picked from the candidates left after Step 16: local export (MVP item 22) over side-by-side comparison (bigger scope, needs a two-swing picker and synchronized playback) and the tab-bar icon gap (needs an icon-library decision, lower value than a real MVP checklist item).

**Library decision:** core React Native's `Share` API only reliably supports local `file://` URIs on iOS — Android throws `FileUriExposedException` for a raw file path passed into `ACTION_SEND`, needing a `content://` URI backed by a `FileProvider`, which core RN doesn't set up. Checked `react-native-share` (actively maintained, 12.3.1, no narrow peer-version constraint) — its bundled `AndroidManifest.xml` registers its own `FileProvider` that Gradle's manifest merger picks up automatically, so no manual per-project FileProvider XML is needed. Chose it over hand-configuring a `FileProvider` ourselves (real native Android work for an already-solved problem, same reasoning as ADRs 0004/0005/0007 against hand-rolling native code a maintained library already does correctly). Recorded in `docs/adr/0011-video-export-library.md`.

**Scope decision:** exports the **raw source video only**, not an "annotated" one — PRD's annotated-export item needs overlay-rendered pose/angle data that doesn't exist until Phase 2. Labeled honestly in the Checklist (item 22 stays unchecked) rather than claiming a requirement is met when it isn't.

**Built:** `ReplayScreen` gained an "Export" button (shown regardless of playback state, since export operates on the file path directly, not the player) that calls `Share.open({ url: 'file://<path>', type: 'video/mp4', filename, failOnCancel: false })`. `failOnCancel: false` makes the user dismissing the share sheet *resolve* the promise (with `dismissedAction: true`) rather than reject it — checked and treated as a normal, silent outcome; a genuine failure (e.g. no app can handle the file type) still surfaces an alert.

**Testing:** added a manual Jest mock for `react-native-share` (ships none). Three new `ReplayScreen.test.tsx` cases: export calls `Share.open` with the right file URI/type/filename; dismissing the share sheet doesn't show an error; a genuine failure does.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (65 tests now, up from 62).

**Known open items:**

- Not build-verified on a real simulator/emulator (both shut down before Step 13, per your instruction) — the Android `FileProvider` behavior specifically cannot be verified without running through an actual share target on a real device/emulator.
- Side-by-side comparison (MVP item 20) and the tab-bar icon gap (Step 12) are still open.
- An actually "annotated" export (overlay-rendered clip) is still blocked on Phase 2 pose data — this step's `Share.open` call site shouldn't need to change when that's added, only what file path gets passed in.

## 2026-08-03 18:10 KST — Step 16: Storage-size estimates in delete confirmations

Closes the last piece of PRD 9.8 flagged as open after Steps 13-14: "Confirmation showing estimated storage to be freed."

**Repository:** `swingRepository` gained `getSwingSizeBytes(swingId)` (sums file sizes in one swing's directory — flat, no subdirectories, so a single `readDir` is enough; `readDir`'s own result entries already carry `size` per file, no separate `stat()` calls needed) and `getTotalSwingsSizeBytes()` (sums every swing). Both return `0` rather than throwing when nothing exists yet — this is informational for a confirmation dialog, not a precondition that should block anything.

**Utility:** new `src/utils/formatBytes.ts` (`formatBytes(bytes)` → `"4.2 MB"` etc.) — the first file in a plain `utils/` directory in this app; small and general enough not to belong in `data/` or any single screen's file.

**UI:** `HistoryScreen`'s per-swing delete confirmation and `SettingsScreen`'s delete-all-data confirmation both now fetch the relevant size before showing the `Alert` and include it in the message (e.g. "will be permanently deleted, freeing 4.2 MB").

**Testing:** `formatBytes.test.ts` (byte/KB/MB/GB boundaries). `swingRepository.test.ts` gained `getSwingSizeBytes`/`getTotalSwingsSizeBytes` cases (sums correctly; returns 0 when nothing exists). `HistoryScreen.test.tsx` and `SettingsScreen.test.tsx` each gained a case asserting the formatted size actually appears in the alert message, not just that some size was computed — the two existing "deletes after confirming" tests already exercised the async `getSwingSizeBytes`/`getTotalSwingsSizeBytes` call implicitly (via the default RNFS mock resolving to empty results) without needing changes, which is worth noting as a case where an existing test kept passing without being a meaningful check of the new behavior — hence the two new, more targeted tests.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (62 tests now, up from 49).

**Known open items:**

- Not build-verified on a real simulator/emulator (both shut down before Step 13, per your instruction).
- PRD 9.8's "optional short undo period before final removal" is still unbuilt — the last remaining piece of that section.
- The tab-bar icon gap from Step 12 is still open.

## 2026-08-03 17:50 KST — Step 15: Swing tagging

Picked from the candidates left after Step 14: swing tagging (MVP item 19) over the tab-bar icon gap — another concrete MVP checklist item, native-independent, and directly extends `HistoryScreen`'s existing per-swing action row (Tags, alongside the Delete button from Step 13).

**Domain:** `Swing` gained a `tags: string[]` field (PRD 5.11). Unlike `handedness` (Step 10, required — no historical manifest ever lacked it), `tags` is optional in the raw manifest and defaults to `[]` when absent, since older manifests genuinely predate this field and shouldn't be treated as corrupt. `parseSwingManifest` validates that, when present, `tags` is an array of non-empty strings.

**Repository:** `swingRepository.setSwingTags(swingId, tags)` reads and *parses* the existing manifest (via `parseSwingManifest`, not a raw read) before rewriting it with only `tags` changed — a deliberate choice: it fails loudly on a corrupt manifest rather than silently overwriting one with a partial/malformed one.

**UI:** `HistoryScreen` rows show existing tags as small chips (visible without opening anything), plus a new "Tags" button that opens a `Modal`-based editor: existing tags as removable chips (tap to remove), a `TextInput` to add new ones (submit via the keyboard's return key), and Cancel/Save. Save calls `setSwingTags` and reloads the list; a failure shows an alert rather than silently discarding the edit.

**Testing:** `swing.test.ts` gained cases for tags being parsed when present, defaulted to `[]` when absent, and rejected when malformed (non-array, non-string entries, empty-string entries). `swingRepository.test.ts` gained `setSwingTags` cases (rewrites preserving other fields; throws rather than overwriting a corrupt manifest — mirrors the domain-level design choice). `HistoryScreen.test.tsx` gained three cases: add-and-save, remove-via-chip-then-save, and cancel-without-saving.

**Bugs caught by failing tests, not by inspection:**

- The "add a tag" test initially called `onChangeText` and `onSubmitEditing` back-to-back inside one `act()` block — but `onSubmitEditing`'s closure (via `addTag`'s `useCallback`) was captured from the render *before* `onChangeText`'s state update had flushed, so it still saw the old (empty) draft text. Fixed by splitting them into separate `act()` calls, letting React re-render between them — the same category of stale-closure timing issue, just in a new shape.
- Adding tests that open the `TagEditorModal` (more re-renders of the underlying `FlatList`) tipped a previously-dormant issue into actually failing: `VirtualizedList`'s internal debounced `setState` (`_updateCellsToRenderTimeoutID`) fired *after* the test file finished, and Jest treats a `console.error` logged post-teardown as a hard failure — invisible in the per-test-suite pass/fail summary, but `pnpm test`'s aggregate exit code was 1 despite every individual test passing. Fixed by hoisting `tree` to `describe`-scope and unmounting it in `afterEach` (the same pattern already used in `App.test.tsx` since Step 10), which lets `VirtualizedList` clear its pending timer via `componentWillUnmount` before the file's context tears down.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (49 tests now, up from 44 — and `pnpm test`'s exit code itself, not just the visible pass count, was worth double-checking after the `VirtualizedList` fix).

**Known open items:**

- Not build-verified on a real simulator/emulator (both shut down before Step 13, per your instruction).
- No sort/filter/search-by-tag UI yet (PRD 5.11 also lists these) — this step covers adding/removing tags only, not using them to organize the list.
- The tab-bar icon gap from Step 12 is still open.

## 2026-08-03 17:25 KST — Step 14: Delete-all-data control (Settings)

Direct follow-on from Step 13 — PRD 9.8 lists "delete-all-data control" as distinct from per-swing deletion, and `OnboardingScreen`'s own privacy-notice text already promises "You can delete any swing, or all of your data, at any time from Settings" — a promise `SettingsScreen` (still a placeholder) had no way to keep until now.

**Built:**

- `swingRepository.deleteAllSwings()`: `unlink`s the entire `SWINGS_ROOT` directory in one call (a no-op, not an error, if no swings have been recorded yet — checked via `exists()` first).
- `profileRepository.deleteProfile()`: same pattern for `profile.json`.
- `profileStore` gained a `clear()` action: deletes the persisted profile and sets `{ profile: null, status: 'loaded' }` in the store directly — deliberately not calling `load()` again afterward, since we already know the result (no redundant disk read), and it immediately sends the user back through `OnboardingScreen` via `App.tsx`'s existing gating logic.
- `SettingsScreen`: a real "Delete all data" control — confirms via `Alert.alert` (naming what will happen: swings deleted, profile reset, setup repeated), then calls `deleteAllSwings()` and `clearProfile()` in sequence; a failure at either step shows a second alert with the underlying error rather than leaving the user unsure whether anything happened.

**Testing:** `deleteAllSwings`/`deleteProfile` each got two repository-level cases (unlinks when something exists; no-op when nothing does). `profileStore.test.ts` gained a `clear()` case. New `SettingsScreen.test.tsx` (confirmed deletion calls both repository functions and resets the store; a failure surfaces the error alert without crashing and leaves the profile untouched).

**Bug caught by a failing test, not by inspection:** the "deletion fails" test initially passed a rejecting `unlink` mock but left `exists()` at its default `false` — since both `deleteAllSwings` and `deleteProfile` check `exists()` before calling `unlink` at all, neither delete function would have actually run, so the rejection path was never exercised and the test's own assertion would have been checking against code that never executed. Fixed by mocking `exists()` to `true` in that test. Also hit the same `clearAllMocks()`-doesn't-reset-`mockRejectedValue` leakage from Step 13 again (a rejected implementation from an earlier `describe` block bled into a later one) — fixed by explicitly setting `mockResolvedValue` in the new test rather than assuming the default.

**Full workspace validation passed:** `pnpm lint` (one real catch: `colors` import went unused in `SettingsScreen.tsx` after using `#D14343` directly for the destructive-button color, matching the existing inline-hex pattern already used for destructive UI elsewhere in this codebase, e.g. `RecordScreen`'s stop button), `pnpm typecheck`, `pnpm test` (44 tests now, up from 37).

**Known open items:**

- Not build-verified on a real simulator/emulator (both were shut down before this step, per your instruction).
- PRD 9.8's "optional short undo period" and "confirmation showing estimated storage to be freed" are still unbuilt — this and Step 13 cover immediate deletion only, per-swing and all-at-once.
- The tab-bar icon gap from Step 12 is still open.

## 2026-08-03 17:05 KST — Step 13: Local swing deletion

Picked from the two candidates left after Step 12 (tab-bar icons vs. native-independent MVP items): deletion over icons — it's a core PRD 9.8 privacy/data-control requirement and part of the app actually being usable (History could list swings but never remove any), not just cosmetic polish.

**Built:**

- `swingRepository.deleteSwing(swingId)`: `unlink`s the swing's whole directory (`<DocumentDirectoryPath>/swings/<id>/`) in one call — `@dr.pogodin/react-native-fs`'s `unlink` recursively removes a directory and its contents (confirmed from its own README, not assumed), so this correctly removes the source video, manifest, and anything future analysis steps add alongside them, per PRD 9.8's requirement that deletion remove everything associated with a swing, not just the manifest record.
- `HistoryScreen`: each row now has a "Delete" button. Pressing it shows a native confirm/cancel `Alert.alert` (PRD 9.8's "immediate deletion" tier — the optional "short undo period" tier is not built) naming the club and date so the user knows what they're about to remove; confirming deletes and reloads the list; a failure shows a second alert with the underlying error message rather than failing silently.
- Restructured `SwingRow`'s layout: the outer row is now a plain `View` (was itself the pressable-to-Replay element), with a `Pressable` wrapping just the title/subtitle for navigation, and a separate `Pressable` for delete — necessary since a row can't have two independent tap targets if the whole row is one `Pressable`.

**Testing:** `swingRepository.test.ts` gained two `deleteSwing` cases (unlinks the right path; propagates a failure rather than swallowing it — deletion failing silently would violate PRD 9.8's confirmation-and-visibility intent). `HistoryScreen.test.tsx` gained two cases: confirming the alert deletes and refreshes to the empty state; a failed delete shows the second alert. Both mock `Alert.alert` by directly invoking the "destructive" button's `onPress`, the standard RN testing pattern for native alerts. Also had to update the pre-existing "navigates to Replay" test — the tap target moved from the whole row (`testID="swing-row"`) to the new inner `Pressable` (`testID="swing-row-content"`) as part of the layout restructure.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (37 tests now, up from 33 — 4 new: 2 repository, 2 screen).

**Known open items:**

- Not build-verified on a real simulator/emulator this step (the ones from Steps 11–12 were shut down per your request before this work started).
- PRD 9.8's "optional short undo period" and "delete-all-data control" are still unbuilt — this step covers per-swing immediate deletion only.
- The tab-bar icon gap from Step 12 is still open.

## 2026-08-03 16:45 KST — Step 12: Android emulator verification (parity with Step 11's iOS check)

Direct follow-up to Step 11's "Next up" — closing the gap where iOS got a real install+launch+screenshot but Android only got a successful Gradle build. All reasoning added to `docs/adr/0010-real-build-verification.md` section 9 rather than a new ADR, since it's the same investigation.

**Set up an Android emulator from scratch:** Android Studio's own install doesn't include a standalone `sdkmanager`/`avdmanager` — downloaded Google's command-line-tools zip separately, extracted to `~/Library/Android/sdk/cmdline-tools/latest`, accepted SDK licenses, installed a `system-images;android-34;google_apis;arm64-v8a` image, created an AVD (`golf-swing-test`, Pixel 7 profile) via `avdmanager`, and booted it.

**Installed and drove the already-built debug APK** (from Step 11) on the emulator: `adb install`, `adb reverse tcp:8081 tcp:8081` (the emulator doesn't share the host's `localhost` the way the iOS Simulator does — Metro is unreachable without this), `adb shell am start`, then `adb shell input tap` to actually click through the onboarding flow (privacy notice → profile setup → Home tab) and `adb shell screencap` to capture each step.

**Confirmed:** the Step 11 safe-area fix holds on Android too (title sits cleanly below the status bar, matching iOS), and the full persisted-profile onboarding-gate flow works end-to-end on a second, independent platform.

**Surfaced a real, previously invisible UX gap:** the bottom tab bar shows a visible "missing icon" placeholder box above every tab label on Android (subtler on iOS, but the fallback code path is identical on both). Traced to `@react-navigation/bottom-tabs`' own `BottomTabBar.js`: `options.tabBarIcon ?? MissingIcon` — `RootNavigator.tsx` has never set `tabBarIcon` on any `Tab.Screen`, since nobody had actually looked at a rendered tab bar until Step 11. Deliberately **not fixed here** — picking an icon library (`@expo/vector-icons`, `react-native-vector-icons`, `lucide-react-native`, etc.) is its own dependency decision, deserving the same maintenance/licensing scrutiny every other dependency in this project has gotten, not a rushed pick to silence a cosmetic gap.

**No code changed this step** beyond doc updates — this was pure verification (emulator setup + driving the existing build), not new application logic.

**Known open items:**

- The tab-bar icon gap needs its own follow-up: pick an icon library, then set `tabBarIcon` per tab in `RootNavigator.tsx`.
- Still only simulator/emulator coverage on both platforms — no physical device testing has happened yet.

## 2026-08-03 16:25 KST — Step 11: Real build verification — Xcode + Android Studio installed

You installed Xcode and Android Studio on this machine. Every step since Step 2 has carried a "not build-verified" caveat — this was the first chance to actually close that out. Full details and reasoning for each fix are in `docs/adr/0010-real-build-verification.md`; summary here.

**Got both platforms building for real**, fixing several genuine bugs along the way (not just environment setup):

1. `apps/mobile/package.json` was missing `@react-native/gradle-plugin` and `@react-native/codegen` as direct devDependencies — both are transitive deps of `react-native` itself, invisible under pnpm's strict isolation until a build actually reached the Gradle/codegen stage that needs them.
2. `react-native-screens` `^4.26.2` doesn't build against RN 0.81.6: its 4.26.0+ experimental "gamma" stack-header component uses a codegen type (`React.ComponentRef<>`) this RN version's codegen doesn't understand. Pinned to `4.24.0` (predates that file, peer-compatible with RN 0.81.x — verified directly against downloaded tarballs, not assumed).
3. CocoaPods belongs in `apps/mobile/Gemfile` (already generated by the RN template in Step 2, with known-good version pins), not the repo-root `Gemfile` — my first attempt added it to the wrong one before finding the existing app-scoped one.
4. `fmt` 11.0.2 (a transitive dependency via glog/hermes) miscompiles under Xcode 26.6's Clang — its `consteval` codepath fails with a real compiler error. Fixed via a `post_install` hook in `apps/mobile/ios/Podfile` that patches the vendored header after every `pod install` (verified the exact fix first by patching the installed copy directly and rebuilding, before committing to automating it).
5. JDK 17 (this project's pin) installed via a Temurin tarball extracted to `~/.jdks/` — no `sudo` needed, since Android Studio's bundled JBR is a much newer major version and Homebrew's JDK cask requires `sudo`.

**Result:** `./gradlew assembleDebug` succeeds (real `.apk` produced). `xcodebuild ... -sdk iphonesimulator build` succeeds. Went further than "it compiles" — installed the built app on a booted `iPhone 17` simulator, started Metro, launched it, and took real screenshots.

**Found a real bug this way, not by inspection:** the onboarding privacy screen's title was overlapped by the status bar. Turned out **no screen in the entire app used safe-area insets** — `SafeAreaProvider` has been wired at the root since Step 2, but every screen's root container was a plain `View`/`ScrollView`, never a `SafeAreaView` or `useSafeAreaInsets()` consumer. Invisible in every Jest test so far, since `react-test-renderer` doesn't do real layout. Fixed by switching every screen's root container to `SafeAreaView` (`ScreenContainer.tsx` — shared by Home/Settings/Training —, `HistoryScreen.tsx`, `RecordScreen.tsx`, `OnboardingScreen.tsx`), `edges={['top']}` for tab screens (bottom already handled by the tab bar), full edges for `OnboardingScreen` (no tab bar underneath). Rebuilt and re-screenshotted to confirm: title now sits cleanly below the status bar.

**Also discovered, not chosen:** `pod install` set `RCTNewArchEnabled = true` — RN 0.81's New Architecture (Fabric + TurboModules) is on by default, not something anyone in this project explicitly opted into. Explains why codegen was so central to every build error hit today. Recorded in the ADR since nothing had called this out as a deliberate decision before.

**Incidental finding, not evidence of tampering:** the first real simulator run showed the app skip straight past onboarding to the Home tab — a leftover `profile.json` with non-default selections (`primaryClub: "iron"`) was already sitting in the simulator's app container, most likely from you trying the app yourself in Xcode before mentioning the installs. Confirmed this by inspecting the file directly; deleted it to re-verify the onboarding flow (and the safe-area fix) from a clean state.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (unchanged, 33 tests — these are pure JS/RN component changes, no native code touched), `pnpm doctor` (now fully green: Xcode and Android SDK both `OK`, no more `MISSING` rows).

**Known open items:**

- Physical device testing still hasn't happened (simulator/emulator only) — camera capture, permission prompts, and actual recording still need real hardware (simulators have no camera).
- Android: only the Gradle build itself was verified end-to-end (`assembleDebug` succeeded) — no emulator system image is installed yet, so the app hasn't actually been launched/screenshotted on Android the way it was on iOS. Worth doing as a quick follow-up (`sdkmanager` isn't available standalone in this environment, but Android Studio's own AVD manager could provision one).
- The `fmt` consteval Podfile patch and the `react-native-screens` downgrade are both workarounds for upstream bugs, not permanent fixes — flagged in ADR 0010 for revisiting once upstream catches up.

## 2026-08-03 14:20 KST — Step 10: Onboarding — local user profile + privacy notice

Both remaining native-independent next steps identified at the end of Step 9 (a local user-profile flow, and privacy-architecture-as-an-in-app-flow) turned out to be the same PRD user journey — PRD 4.1 (First Launch) already combines them: explain local-only storage, get acknowledgment, then collect handedness/skill level/club/units. Built both together as one onboarding flow rather than as two separate, artificially split features.

**Domain layer (`packages/domain`):**

- New `profile.ts`: `Handedness`/`SkillLevel`/`Units` types, `Profile` interface, `parseProfile` (same validate-or-throw pattern as `parseSwingManifest` — `InvalidProfileError` rather than accepting partial data). `CLUB_TYPES` exported from `swing.ts` so both parsers share one club vocabulary instead of maintaining two independent lists.
- `Swing` gained a required `handedness` field, closing the gap Step 9's swing-angle-definitions review surfaced (lead/trail elbow and heel measurements are undefined without it). `swing.ts` imports `Handedness` from `profile.ts` as a type-only import — no runtime circular dependency, since `profile.ts`'s import of `CLUB_TYPES` from `swing.ts` is the only runtime edge between the two files.
- 8 new tests in `profile.test.ts` (valid profile, 5 rejection cases); extended `swing.test.ts`'s fixture and rejection cases for the new field.

**App layer (`apps/mobile`):**

- `src/data/profileRepository.ts` (`loadProfile`/`saveProfile` against `<DocumentDirectoryPath>/profile.json`) and `src/state/profileStore.ts` (Zustand, `status: 'loading' | 'loaded'` + `profile: Profile | null`) — same shape as `swingRepository`/`recordingSetupStore` before it.
- Extracted `OptionRow` (the labeled-choice-row control) out of `RecordScreen.tsx` into `src/components/OptionRow.tsx` — its second real usage (the new onboarding profile step) crossed the bar for sharing it, not before.
- `OnboardingScreen.tsx`: a two-step wizard (`'privacy' | 'profile'` local state, no extra navigator needed for a linear 2-step flow) — a privacy-notice screen, then handedness/skill-level/club/units selectors via `OptionRow`, saving through `profileStore`.
- `App.tsx` now gates on `useProfileStore`: a brief themed loading view while `profile.json` is read, `OnboardingScreen` if no profile exists yet, otherwise the existing tab navigator — unchanged for anyone who's already onboarded.
- `RecordScreen` now reads `handedness` from the profile store (non-null — `RootNavigator` never mounts without a profile, so this is a safe assumption, not a null-check-and-hope) and writes it into `analysis-manifest.json`.

**Bug caught by a failing test, not by inspection:** `App.tsx`'s `useEffect` called `load()` unconditionally on every mount, which clobbered a test's preset profile back to `null` immediately after render (the effect re-ran `loadProfile()`, got the default mocked "no file" result, and overwrote the store) — a real bug, not just a test artifact, since it meant `App` would always show a brief flash back through the loading state even when the profile was already known. Fixed by guarding the effect: only call `load()` while `status === 'loading'`.

**Testing:** `profileRepository.test.ts` (load/save, corrupt-profile-returns-null), `profileStore.test.ts` (initial state, `load()`/`save()` transitions), extended `App.test.tsx` with a full onboarding-to-tab-shell flow test (privacy accept → profile save → Home tab renders) alongside the existing already-onboarded case — and fixed both tests' `act()` hygiene (each test's rendered tree is now explicitly unmounted in `afterEach` before the store reset, since a previous test's still-mounted tree receiving a `setState` outside `act()` was logging real (if harmless) React warnings). Updated `RecordScreen.test.tsx` (seeds the profile store, asserts `handedness` in the written manifest) and the manifest fixtures in `HistoryScreen.test.tsx`/`swingRepository.test.ts` (now require `handedness` per the domain schema change).

**Full workspace validation passed:** `pnpm lint` (one `react-native/no-inline-styles` warning, fixed by moving to `StyleSheet.create`), `pnpm typecheck`, `pnpm test` (10 mobile suites, 33 tests, plus domain package now at 18 tests), `pnpm doctor`.

**Known open items:**

- Not build-verified (same caveat as everything native-adjacent).
- The profile isn't editable after onboarding yet — no Settings-screen entry point to change handedness/skill level/units later, only the one-time onboarding flow.
- MVP item 1 (Local user profile) and item 23 (Privacy and permission screens) are now checked in `Checklist.md`; Phase 0's "Privacy architecture" item is also checked (now built as an in-app flow, not just drafted in the PRD).

## 2026-08-03 13:40 KST — Step 9: Phase 0 discovery — swing-angle definitions, device matrix, ball-tracking feasibility

After Step 8 hit a real blocker (pose-inference library choice gated behind real-device validation this environment can't do), asked how to proceed. Chosen direction: pause Phase 2, go back and address Phase 0 (Product and Technical Discovery) deliverables that were never actually done — several of Phase 2's own roadmap entry gates trace back to these.

Of Phase 0's nine deliverables, three are genuinely completable as desk research/documentation without a device, a golf instructor, or user testing; the other six (final product scope, camera proof of concept, pose-model benchmark, golf-instructor review, privacy architecture as an in-app flow, UX prototype) need a physical device, a domain expert, real users, or a product/business decision only the user can make — not more research from here. Did the three that are actually in scope:

- **`docs/architecture/swing-angle-definitions.md`**: maps every PRD 5.3 named measurement to specific landmarks (using a model-independent landmark set — POSE-002's required set, which happens to match MediaPipe BlazePose's 33-point topology but isn't tied to it, since no library is chosen yet) and a specific formula. Most measurements decompose into either the three-point `calculateJointAngleDegrees` already built (Step 8) or a not-yet-built two-vector variant (`calculateVectorAngleDegrees`, needed for rotation-relative-to-address measurements like hip-line/shoulder-line rotation and spine-angle-vs-vertical) — deliberately not built speculatively, same reasoning as ADR 0009 (don't build ahead of real data to test against). **Surfaced a real gap**: handedness isn't captured anywhere in the app — `packages/domain`'s `Swing` type has no `handedness` field (Step 5 scoped it to exactly what `RecordScreen` writes, which never asks), and there's no onboarding/profile flow at all yet (MVP item 1). Several measurements (lead/trail elbow, lead/trail heel) are literally undefined without it.
- **`docs/qa/device-matrix.md`**: minimum OS versions (iOS 15.1, Android API 24) traced to their actual source — React Native 0.81.6's own Cocoapods helper and Gradle version catalog (confirmed by reading `apps/mobile/ios/Podfile` and `apps/mobile/android/build.gradle` directly, not assumed) — plus PRD 13.4's device-tier categories (oldest/midrange/flagship/multi-cam/lower-memory/OS-spread) restated with what still needs verifying on real hardware per tier. Caught and fixed one hallucinated detail while drafting (an invented "A19-generation" iPhone reference that didn't match the earlier, correct A12-generation claim) before it shipped — cross-checked internal consistency rather than trusting first-draft phrasing.
- **`docs/architecture/ball-tracking-feasibility.md`**: desk assessment against PRD 5.6's four levels (manual annotation / short-range auto-detection / calibrated launch estimation / launch-monitor integration), grounded in concrete physical reasoning (ball size, swing speed, frame rate vs. motion blur) rather than a vague "it's hard." Recommends building Level 1 now (low-risk, shares overlay infrastructure with Phase 2), gating Level 2 behind an actual recorded test corpus (PRD 8.4) rather than building a detector blind, and not attempting Level 3 without dual-camera/calibration work that isn't planned yet. Explicit about what it _can't_ establish: no measured accuracy, since that needs real footage this environment doesn't have.

**`Checklist.md` updated**: Supported device matrix, Ball-tracking feasibility report, and Swing-angle definitions all checked off (the deliverable in each case is the document itself, which now exists) — the other six Phase 0 items left unchecked with a one-line reason each (device/expert/user/business-decision needed, not more agent research).

**No code changed this step** — purely `docs/`. Ran the full validation suite anyway (`pnpm lint`, `pnpm typecheck`, `pnpm test`) to confirm nothing regressed; all green, unchanged from Step 8.

**Known open items:**

- The handedness gap surfaced above should probably be addressed before or alongside Phase 2 pose-inference work, not discovered again later mid-implementation.
- `calculateVectorAngleDegrees` is designed (in the definitions doc) but not built — intentionally, until there's real landmark data to test it against.
- Phase 2 (pose inference, skeleton overlay, phase estimation) remains blocked on the same real-device dependency as Step 8 documented.

## 2026-08-03 13:05 KST — Step 8: Begin Phase 2 — joint-angle formula, defer pose-inference library

Phase 1 is now functionally complete (Step 7). Phase 2 (Pose Analysis MVP) starts with pose inference per `docs/16` roadmap — but PRD section 5.2 explicitly says the pose-model choice needs validating against real iOS/Android devices before locking in, and Phase 0's "Pose-model benchmark" deliverable (gating Phase 2 per the roadmap) is still entirely unstarted in `Checklist.md`.

**Checked the realistic pose-inference paths for React Native:**

- `@mediapipe/tasks-vision` — MediaPipe's web/WASM package, not a native iOS/Android binding; using it here would mean running WASM inference instead of native Core ML/NNAPI-accelerated inference, defeating PRD 7.1's on-device native-inference architecture.
- `react-native-mediapipe` (cdiddy77) — the one existing RN wrapper around MediaPipe's native Tasks API (built on `react-native-vision-camera` frame processors, which this repo already uses per ADR 0004). Last released **2024-12-12**, 7 releases total, single maintainer, no activity since — well below the maintenance bar every other native dependency here has cleared (vision-camera, `@dr.pogodin/react-native-fs`, `react-native-video`, all picked specifically for active multi-release maintenance).
- Hand-written native modules (Core ML / Vision on iOS, NNAPI/TFLite on Android) — most control, but the largest new native surface in this project yet, and exactly what Phase 0's benchmark deliverable exists to de-risk before committing.

**Decision:** don't lock in a pose-inference library yet — none of the three options clear this repo's bar, and PRD 16 already gates the choice behind device validation this environment can't perform (still no Android Studio; Xcode's license situation is noted below). Recorded in `docs/adr/0009-defer-pose-inference-library.md`.

**Built instead:** the part of Phase 2 that's fully specified and native-independent — PRD 5.3's joint-angle formula. New workspace package `packages/analysis-engine` (previously just a placeholder README, following the same pattern `packages/domain` was in before Step 5): `calculateJointAngleDegrees(a, b, c, minConfidence?)`, implementing the PRD's exact formula (`θ = arccos((BA·BC)/(|BA||BC|))`) with the cosine input clamped to `[-1, 1]` (required — floating-point error can push near-collinear points fractionally outside that range, which would otherwise make `Math.acos` return `NaN`), and confidence-gated per landmark (throws `InsufficientConfidenceError` rather than silently computing from unreliable data, per PRD 5.3: "Reject calculations with insufficient landmark confidence"). Operates on a plain `{x, y, confidence}` point — not the full `Landmark`/`PoseFrame` domain model PRD 7.1 describes, since no pipeline produces that real shape yet; deliberately kept minimal rather than modeling ahead of real data.

**Testing:** 10 cases — right angle, straight line (180°), overlapping direction (0°), scale-invariance, per-landmark confidence rejection (×3), a custom `minConfidence` override, the documented default value, and a zero-length-segment rejection.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (now 5 workspace packages — `packages/analysis-engine` added), `pnpm doctor`.

**Environment note:** `/usr/bin/git` now works directly again (the Xcode-license block from the previous entry is gone — `git version 2.50.1`, `Xcode 26.6` reports OK in `pnpm doctor`). Not something this agent did; noting it since prior commits in this session used `/Library/Developer/CommandLineTools/usr/bin/git` as a workaround and this one didn't need to.

**Known open items:**

- Pose inference, skeleton overlay, landmark smoothing, and phase estimation are all still unbuilt — blocked on the library decision above, which is itself blocked on real device validation.
- The higher-level PRD 5.3 metrics (knee angle, hip rotation, shoulder tilt, etc.) aren't built yet either — they're straightforward applications of `calculateJointAngleDegrees` once real landmark sequences exist, not a new algorithm.
- Android Studio is still not installed in this environment; that (plus getting real device time) is the actual unblock for the pose-inference decision, not more research from here.

## 2026-08-03 12:20 KST — Step 7: Crash handling

Scoped per `docs/adr/0008-crash-handling-scope.md`: build what can actually be delivered responsibly in this environment (no way to create a real crash-reporting vendor account or review its data practices from here), defer the rest to Phase 6 with the reasoning on record rather than silently skipping it or faking a placeholder SDK integration.

**Built**, all under `apps/mobile/src/diagnostics/`:

- `diagnosticLog.ts`: `appendDiagnosticLog`/`readDiagnosticLog` against `<DocumentDirectoryPath>/logs/diagnostics.log` (PRD 7.6 already reserved `logs/` for this). Rotates by rewriting the whole file capped at 500 entries — simple and correct at this scale, avoiding partial-append edge cases. Write failures are caught and `console.warn`ed rather than thrown: this is itself the error-handling path, and a broken log must never mask the original error. Callers only ever pass an error's `message`/`stack`, never video/pose/notes data (PRD 14.1's exclusion list).
- `ErrorBoundary.tsx`: a class component (React error boundaries require lifecycle methods, no hook equivalent exists) catching render-time errors anywhere below it, logging via `diagnosticLog`, and rendering a "Something went wrong" fallback with a "Try again" button instead of leaving the app white-screened.
- `installGlobalErrorHandler.ts`: wraps (not replaces) React Native's own `ErrorUtils.setGlobalHandler`, catching fatal errors thrown outside React's render tree (async callbacks, event handlers) that `ErrorBoundary` structurally cannot see, then still calls through to whatever handler was previously installed (dev redbox, future native crash reporting).
- `App.tsx`: wraps `<NavigationContainer>` in `<ErrorBoundary>`; `installGlobalErrorHandler()` runs once at module scope so it's active before the first screen mounts.

**Bugs caught by `tsc`, both fixed:**

- `global` isn't a recognized identifier under this repo's strict TS config (no `@types/node`, no DOM lib) — switched to `globalThis`, which is standard-library and needs no extra types.
- `exactOptionalPropertyTypes: true` (root `tsconfig.base.json`) rejects assigning `stack: string | undefined` to an optional `stack?: string` field — fixed by conditionally spreading the property in rather than assigning `undefined` to it, in both `ErrorBoundary.componentDidCatch` and `installGlobalErrorHandler`.

**Testing:** `diagnosticLog.test.ts` (new-file write, append, rotation at the 500-entry cap, and that a write failure doesn't throw); `ErrorBoundary.test.tsx` (renders children normally; a throwing child triggers the fallback and logs; "Try again" recovers once the underlying error condition clears); `installGlobalErrorHandler.test.ts` (no-op when `ErrorUtils` is absent — true in this Jest environment, RN's preset doesn't install one; logs and still calls the previous handler when present, using a manual `globalThis.ErrorUtils` stand-in). Extended the `@dr.pogodin/react-native-fs` Jest mock with `exists`.

**Bugs caught while writing tests, both fixed:**

- Same `findAllByProps` double-match issue hit in Step 3 (matches both the composite element and its underlying host node) — switched the fallback-rendered assertion to `.length > 0` instead of an exact count.
- The global-handler test's `await Promise.resolve()` (x2) wasn't enough to flush `appendDiagnosticLog`'s several chained `await`s before asserting — replaced with a macrotask flush (`await new Promise<void>(resolve => setImmediate(resolve))`), which reliably drains all pending microtasks first.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (8 mobile suites, 24 tests, plus domain/tooling-smoke-test), `pnpm doctor`.

**Environment note, unrelated to this step's code:** `pnpm doctor` now reports **Xcode 26.6 present** on this machine (previously MISSING) — but its license hasn't been accepted (`sudo xcodebuild -license`, an interactive/sudo step outside this agent's scope). `/usr/bin/git` itself is gated behind that same license and failed outright; commits in this and future sessions use `/Library/Developer/CommandLineTools/usr/bin/git` instead, which works unaffected. Once the license is accepted, real iOS build verification may finally be possible — flagging for a human to action, not doing it silently.

**Known open items:**

- Crash handling is still not build-verified (same caveat as everything native-adjacent).
- The user-facing "generate a support package" flow (PRD 14.2, share the diagnostic log via the OS share sheet) and an actual crash-reporting SDK (PRD 14.1) are explicitly deferred to Phase 6 — see `docs/adr/0008-crash-handling-scope.md`.
- RecordScreen's existing error paths (save failure, `onRecordingError`) still only show an on-screen message; they don't yet also write to `diagnosticLog`. Left alone to keep this step's diff scoped to the crash-handling infrastructure itself — worth wiring up as a small follow-up.
- Phase 1: Recording Foundation is now functionally complete (every deliverable checked except "Native camera modules," which ADR 0004 already superseded with `react-native-vision-camera`). Next real milestone is Phase 2: Pose Analysis MVP — starting with a pose-inference library/model decision, mirroring how Step 3 approached camera capture.

## 2026-08-03 11:45 KST — Step 6: Replay (video playback of a saved swing)

Scoped to Replay only, per the plan left at the end of Step 5 — a video-playback library decision, plus enough navigation to actually reach a saved swing's video from History.

**Library decision:** Checked npm for the realistic options. `react-native-video` 6.19.2 is the current stable line (66+ published 6.x releases, most recent 2026-07-07), with no narrow peer-version window to work around (`react: '*'`, `react-native: '*'`) — unlike the reanimated 4.x constraint hit in ADR 0003. Hand-writing an AVPlayer/ExoPlayer wrapper was rejected for the same reason ADR 0004 rejected hand-written camera capture: reimplementing a mature library, unverifiable in an environment with no Xcode/Android Studio anyway. `expo-video` was rejected per PRD section 7.4's existing rejection of managed-Expo dependencies for core native functionality. Recorded in `docs/adr/0007-video-playback-library.md`.

**Navigation decision:** The History tab was a single flat screen with no way to push a detail view. Added `@react-navigation/native-stack` 7.18.6 (same major as the already-installed `@react-navigation/native` 7.3.14) and a new `HistoryStackNavigator` (`HistoryList` → `Replay`), swapped in as the History tab's screen component in `RootNavigator`. `HistoryScreen` and `ReplayScreen` are typed against a shared `HistoryStackParamList` (`apps/mobile/src/navigation/types.ts`) and receive `navigation`/`route` as ordinary props from React Navigation — no `useNavigation()`/`useRoute()` hooks, consistent with how every other screen in this codebase is written so far.

**Built:**

- `swingRepository.ts` gained `swingVideoPath(swingId)`, deriving `<DocumentDirectoryPath>/swings/<id>/source.mp4` from the same layout `RecordScreen` already writes — no new stored field needed since the path is fully determined by the id.
- `HistoryScreen`'s `SwingRow` is now a `Pressable` that calls `navigation.navigate('Replay', { swingId })`.
- `ReplayScreen.tsx`: a `loading → ready/error` state machine around `<Video controls>`, covering PRD section 5.10's baseline (play/pause/scrubber, via the library's built-in controls) — deliberately not slow-motion speed control or frame-by-frame scrubbing (MVP items 17-18), which depend on pose data that doesn't exist until Phase 2 and are a separate, later step.

**Testing:** added a Jest mock for `react-native-video` in `jest.setup.js` (ships none, same treatment as vision-camera) exposing just the `onLoad`/`onError` callback surface `ReplayScreen` uses. New `ReplayScreen.test.tsx` (source path, loading state, load transitions to ready, error transitions to error state). Extended `HistoryScreen.test.tsx` with a navigation mock (`{ navigation: { navigate: jest.fn() } }` — no full `NavigationContainer` needed, since screens receive navigation as a prop) and a test asserting a row press calls `navigate('Replay', { swingId })`. Added a `swingVideoPath` unit test to `swingRepository.test.ts`.

**Bug caught by `tsc`:** `noUncheckedIndexedAccess` flagged `findAllByProps(...)[0]` as possibly `undefined` in the new navigation test — fixed with array destructuring plus a non-null assertion, since the preceding assertion already guarantees the row exists.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (5 mobile suites, 13 tests, plus the domain/tooling-smoke-test packages), `pnpm doctor` (Ruby only resolves correctly with `rbenv init` evaluated in the shell — known open item, not new) — all green.

**Known open items:**

- Playback is still not build-verified — no Xcode/Android Studio in this environment.
- Slow-motion, frame-by-frame scrubbing, swing tagging, deletion, and comparison are all still open (MVP items 17-22).
- Crash handling is the last unchecked Phase 1 deliverable — next step.

## 2026-08-03 02:08 KST — Step 5: Swing domain model + local repository + History screen

Scoped to reading back what Step 4 wrote — a shared `Swing` type, a repository that lists saved swings, and a real History screen. Deliberately not SQLite or Replay (see below and the next step).

**Revisited `packages/local-database`'s "SQLite" README** (written in Step 1, before any real swing data existed) now that swing history is actually needed. Decision: **defer SQLite** — `analysis-manifest.json` per swing already is the durable record, a personal local swing history is realistically hundreds of entries (not a query-performance problem), and SQLite would mean another native dependency that can't be compile-verified here for a scale problem that doesn't exist yet. Recorded in `docs/adr/0006-defer-sqlite.md`. `packages/local-database`'s README updated to point at it instead of implying SQLite is imminent.

**Built:**

- `packages/domain` got its first real content (previously just a README): a `Swing` type matching what `RecordScreen` actually writes, and `parseSwingManifest` — a validating parser that throws `InvalidSwingManifestError` on anything malformed rather than silently accepting partial data. Pure TypeScript, no React Native/I/O, with a real Jest test (10 cases: one valid manifest, nine rejection cases covering each field).
- `apps/mobile` now depends on `@golf-swing/domain` (`workspace:*`) — the first real cross-package import in this monorepo, exercising the monorepo Metro/pnpm/TypeScript wiring built in Step 2. Confirmed the symlink (`apps/mobile/node_modules/@golf-swing/domain -> packages/domain`) resolves correctly for both `tsc` and Jest without any extra configuration.
- `apps/mobile/src/data/swingRepository.ts`: `listSwings()` — `readDir`s the swings root, reads and parses each `analysis-manifest.json` via the domain package's parser, skips (warns, doesn't crash) any directory with a missing/corrupt manifest, sorts newest first. Returns `[]` rather than throwing when the swings directory doesn't exist yet (no swings recorded is not an error).
- `HistoryScreen.tsx` replaced (placeholder → real): loads swings on mount, renders a list (club, view, date, duration) with loading/empty/error states — real data flow, not a static mock list.

**Testing:** extended the RNFS mock with `readDir`; wrote a `swingRepository` test (mixed valid/corrupt/non-directory entries, asserting the corrupt one is skipped and sort order is correct) and a `HistoryScreen` test (empty state, and rendering real fetched swings).

**Bug caught while writing the `HistoryScreen` test:** same class of issue as Steps 2/4 — `{swing.clubType} · {swing.cameraView}` compiles to an array of JSX children (`['driver', ' · ', 'face-on']`), not one string, so a naive `children === 'driver'` check failed. Fixed the test helper to join array children before matching, consistent with the fix already applied in `App.test.tsx`.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (all 4 workspace packages, including the new `packages/domain`), `pnpm doctor` — all green.

**Known open items:**

- Reading real saved swings on an actual device is still not verified — no Xcode/Android Studio in this environment.
- Replay (video playback) is next — needs its own native-dependency decision (e.g. `react-native-video`) and its own test-mocking approach.
- No delete/export/tagging/comparison yet.

## 2026-08-03 01:55 KST — Step 4: Actual recording capture (countdown, start/stop, local file save)

Scoped deliberately to just recording + local file save — no SQLite/`packages/local-database`, History screen, or Replay yet, since those need something to list/play back, which only exists after this step.

**New dependency decision:** needed real filesystem access to move vision-camera's temporary recording output into stable local storage. Checked npm: the original `react-native-fs` hasn't published since **May 2022** (4+ years stale — too risky to trust against RN 0.81.6's New Architecture). `@dr.pogodin/react-native-fs` is an actively maintained fork of the same API, latest release **2026-07-03**. Same reasoning as ADRs 0003/0004: proven API, actively maintained fork over the abandoned original. Recorded in `docs/adr/0005-filesystem-library.md`. Storage root: `RNFS.DocumentDirectoryPath` (private by default on both platforms, not exposed via Files app/external storage unless the app opts in).

**Bug caught before it shipped:** `@dr.pogodin/react-native-fs` has **no default export**, only named exports (`mkdir`, `moveFile`, `writeFile`, `DocumentDirectoryPath`, etc.) — confirmed by reading its actual built output, not assumed from habit. My first draft used `import RNFS from '@dr.pogodin/react-native-fs'`, which would have been `undefined` at runtime. Fixed to named imports before it ever ran.

**Built:** `RecordScreen.tsx` now has a real capture state machine (`idle → counting → recording → saving → saved/error`): pressing "Record" starts a countdown using the selected `countdownSeconds` (3 or 10), then calls `camera.current.startRecording()` via a new camera `ref`; "Stop" calls `stopRecording()`. On `onRecordingFinished`, creates `<DocumentDirectoryPath>/swings/<uuid>/`, moves the video in as `source.mp4`, and writes `analysis-manifest.json` with only the fields we can actually populate today (id, createdAt, club/view/camera/frameRate, durationMs, `analysisStatus: 'pending'`) — no fake placeholders for fields that don't exist yet (pose data, metrics). A brief on-screen confirmation shows the saved swing id.

**Testing:** extended the vision-camera Jest mock with `useImperativeHandle`-exposed `startRecording`/`stopRecording` (they're instance methods called via ref, not statics), and added a manual mock for `@dr.pogodin/react-native-fs`. Two new tests drive real state transitions with fake timers: countdown → recording → save (asserting `mkdir`/`moveFile`/`writeFile` were called with the expected paths/content, not just "didn't crash"), and Stop actually calling `stopRecording`.

**Bugs found while writing the test, both fixed:**

- `jest.advanceTimersByTime(3000)` in one call didn't fire all three countdown ticks — each tick reschedules its own `setTimeout` from a `useEffect`, so React needs to flush a render between each one. Fixed by advancing 1000ms at a time across three separate `act()` calls.
- Two `no-bitwise`/`no-void` ESLint warnings from the UUID generator and a fire-and-forget async call — addressed directly (a scoped `eslint-disable` for the standard bitwise UUID idiom; removed the unnecessary `void` since nothing required suppressing the floating promise here).

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` — all green.

**Known open items:**

- Still not build-verified on a real device/simulator — no Xcode/Android Studio in this environment.
- Frame rate is a UI selector only, not yet wired to an actual `useCameraFormat`/device capability query.
- No SQLite/local-database repository, History screen, or Replay yet — next step.

## 2026-08-03 01:38 KST — Step 3: Camera capture screen (react-native-vision-camera) + permission flow

Per your direction, this step decided the camera capture library and installed it, rather than deferring that decision.

**Library decision:** Checked npm for the realistic paths. `react-native-vision-camera` `@latest` is 5.2.1 — a Nitro-Modules-based rewrite (mandatory `react-native-nitro-modules`/`react-native-nitro-image` peers) with a much larger, newer API surface (sessions, output configs, gesture controllers) and far less community track record. The 4.x line (latest 4.7.3, 29 releases since 4.0.0) uses the classic, extensively documented API, and its advanced-feature peers (`react-native-reanimated`, `@shopify/react-native-skia`, `react-native-worklets-core`) are all **optional** — not needed for plain photo/video capture. Same reasoning as ADR 0003 (RN 0.81.6 over `@latest`): picked the more proven, narrower-risk option, especially since neither is compile-verifiable in this environment. **Decision: `react-native-vision-camera` 4.7.3**, recorded in `docs/adr/0004-camera-capture-library.md`. `native/ios-swing-capture` and `native/android-swing-capture` READMEs updated — their purpose is now future custom frame-processor _plugins_ (e.g. the pose-inference bridge, Phase 2), not full camera capture reimplementation, since vision-camera already provides that.

**Built:**

- `RecordScreen.tsx` replaced (placeholder → real UI): permission gate showing live status via `Camera.getCameraPermissionStatus()`/`getMicrophonePermissionStatus()`, a real "Grant camera access" button calling `Camera.requestCameraPermission()`, and — once granted and a device is available — an actual `<Camera>` preview component, not a placeholder. Club/camera-view/frame-rate selectors and an audio toggle (PRD section 10.3). Front/rear selection via `useCameraDevice()`; dual camera deliberately not offered (PRD CAM-003/CAM-004 — concurrent-capture capability can only be checked on a real device).
- `recordingSetupStore.ts`: a real Zustand store (club/view/camera-position/frameRate/countdown/audio), same bar as `uiStore`.
- `Info.plist` (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`) and `AndroidManifest.xml` (`CAMERA`, `RECORD_AUDIO` permissions) — plain config, inspectable but not build-verified.
- A manual Jest mock for `react-native-vision-camera` in `jest.setup.js` (the library ships none for either version) covering the static permission methods and the `Camera`/`useCameraDevice` surface actually used, plus a real test (`RecordScreen.test.tsx`) driving an actual state transition — not-determined → request → granted → preview appears — rather than a render-without-crashing smoke test.

**Bugs found while writing the test, both fixed:**

- A generic function (`OptionRow<T extends string | number>`) in a `.tsx` file is ambiguous with JSX to some parsers — fixed with the standard trailing-comma disambiguation (`<T extends string | number,>`).
- `findAllByProps({ testID })` matches both the composite element and its underlying host node when the prop passes through unchanged, returning 2 matches for one visually-present element, not 1 — switched assertions to presence/absence (`.length > 0`) instead of an exact count.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` — all green.

**Known open items:**

- The vision-camera integration itself is **not build-verified** — still no Xcode/Android Studio in this environment; first real verification happens on an actual device/simulator once those are installed.
- Actually recording/saving video, the countdown timer, swing-event auto-detection, and frame processors (needed for Phase 2 pose inference) are still not implemented.
- Front/rear capability detection and frame-rate/format availability are shown as static options, not filtered by actual device capability (needs a live device to query).

## 2026-08-03 00:50 KST — Broaden Bash permission allowlist

- Added `Bash(*)` to `.claude/settings.json` per explicit request, so routine commands stop prompting for approval during active development. Kept the earlier exact-match `pnpm run *` rules alongside it (harmless overlap). Continuing to exercise independent judgment to keep actions scoped to this repo and avoid destructive operations, since permission patterns can't enforce a filesystem boundary themselves.

## 2026-08-03 01:04 KST — Step 2: React Native app shell (`apps/mobile`)

Scoped to shell only, per plan: navigation + placeholder screens, no camera/pose/native modules yet (those are a later step).

**Version decision:** Checked the live npm registry — latest stable React Native is 0.86.2, but `react-native-reanimated` 4.x (needed later for overlay/timeline UI) requires RN 0.83–0.86 specifically, while reanimated 3.x has no such constraint. Pinned **React Native 0.81.6** instead of `@latest` to avoid locking in that narrow range before it's needed. Recorded in `docs/adr/0003-react-native-version.md`; `docs/adr/0002-toolchain-baseline.md` and `docs/architecture/toolchain.md` updated to point at it instead of staying `PENDING`. Also resolved Android `compileSdk`/`targetSdk` 36, `minSdk` 24 from RN 0.81.6's own gradle version catalog.

**Generated** via the official `@react-native-community/cli init` (not hand-rolled) targeting `react-native@0.81.6` / `@react-native-community/template@0.81.6` explicitly, into `apps/mobile`, with `--skip-install` and `--skip-git-init` (root pnpm/git manage this instead).

**Wired into the monorepo** — several real, non-obvious fixes along the way, not just config boilerplate:

- `apps/mobile/package.json` renamed to `@golf-swing/mobile`, `typecheck` script added.
- `tsconfig.json` extends both `@react-native/typescript-config` and the root `tsconfig.base.json` (TS 5's multi-extends), with `forceConsistentCasingInFileNames` explicitly re-overridden to `false` — RN's config deliberately disables it ("causes issues with package.json exports") and our stricter base would have silently re-enabled it.
- `metro.config.js` made monorepo-aware: `watchFolders` includes the workspace root, `resolver.nodeModulesPaths` covers both local and root `node_modules`, `unstable_enableSymlinks: true` for pnpm's symlinked structure.
- **Bug found:** ESLint 8.57 (used by RN's template) auto-detects `eslint.config.js`/`.mjs` by searching _upward_ through parent directories — it found the root's flat config, applied its ignores (which include `apps/mobile/**`), and concluded there was nothing to lint. Fixed by forcing legacy config resolution for this package specifically: `ESLINT_USE_FLAT_CONFIG=false eslint .`. Root `eslint.config.mjs` now explicitly ignores `apps/mobile/**` (it lints itself, independently), and root `package.json`'s `lint` script runs both the root flat-config lint and `pnpm -r --if-present run lint` so per-package lint scripts (like this one) actually execute.
- **Bug found:** RN's default Jest `transformIgnorePatterns` assumes packages live directly under one `node_modules/` — pnpm nests them as `node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>/`, so the default pattern silently skipped transforming `react-native` and `@react-navigation/*`, causing `SyntaxError: Cannot use import statement outside a module`. Fixed with a corrected pattern in `apps/mobile/jest.config.js` that accounts for the optional pnpm nesting before checking package names.
- **Bug found:** `react-native-safe-area-context`'s `SafeAreaProvider` needs real layout measurement to resolve insets, which never happens under `react-test-renderer` — it rendered its children as permanently `null`. Fixed via the library's own documented Jest mock (`jest.setup.js`), correcting one further wrinkle: the mock file uses `export default {...}`, so a plain `require()` of the Babel-compiled output returns `{ default: {...} }`, not the object itself — had to unwrap `.default` explicitly or every named import resolved to `undefined`.
- Same Watchman-hang issue as `packages/tooling-smoke-test` (see 2026-08-02 entry below) reproduced here too; fixed the same way (`watchman: false` in Jest config).
- Deliberately did **not** call `react-native-screens`' `enableScreens()` yet — it's a required peer of `@react-navigation/bottom-tabs` (installed, available for native builds) but has no Jest-safe mock for this version, and turned out to be unnecessary for a shell-only step.

**Source layout** reorganized into the PRD's documented structure: `src/{app,components,features,navigation,screens,state,theme}`. Added `@react-navigation/native` + `bottom-tabs` (5-tab layout: Home/Record/History/Training/Settings, PRD section 10.1) and Zustand with one real store (`useUiStore`, tracking the active tab) — proven genuinely wired via `ActiveTabBanner`, a component every screen renders that reads the store reactively, plus a real test (`__tests__/App.test.tsx`) asserting the rendered text actually reflects it, not just that something rendered without crashing.

**Full workspace validation passed:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` — all green, across all three workspace packages.

**Known open items:**

- iOS/Android native builds are **not verified** in this environment — needs Xcode ≥ 16.1 and Android Studio/JDK 17 installed first (both still manual, flagged since Step 1).
- No camera capture, pose inference, or native Swift/Kotlin modules yet — separate, larger step.
- `react-native-screens`' `enableScreens()` deferred until native builds can actually be tested.

## 2026-08-02 22:45 KST — Add onboarding pointers to README

- README now tells a new contributor exactly what to read and in what order: `CLAUDE.md` (working agreement), `docs/PRD.md` (spec), `Checklist.md` (status at a glance), `Progress.md` (chronological log with reasoning), `docs/adr/` (specific technical decisions).

## 2026-08-02 22:43 KST — Add Checklist.md and timestamp Progress.md entries

- Added `Checklist.md`: a status-at-a-glance view (done/in-progress/not-started) structured after the PRD's delivery roadmap (section 16) and MVP scope (section 3.1), so a new contributor can see where the project stands without reading `Progress.md`'s full narrative. Distinct purpose from this log — check an item only when it's actually done and validated, not when work has merely started.
- Backfilled existing `Progress.md` entries with timestamps from `git log --format=%ai` for the commit that captured each piece of work.
- Every entry going forward includes a timestamp, not just a date.

## 2026-08-02 22:33 KST — Reduce permission prompts

- Added `.claude/settings.json` with a `permissions.allow` allowlist for read-only, non-mutating commands: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run doctor`, `pnpm run format` (exact matches only — deliberately not wildcarded, since `pnpm run *` would also allow mutating scripts like `format:write`).
- Scanned available session transcripts for repeated Bash/MCP calls; found no other qualifying patterns — most commands were wrapped in a one-off PATH/fnm/rbenv activation preamble, which prevents subcommand-level allowlist rules from matching, and everything else that repeated (`git status`, `ls`, `cat`, `head`, `tail`, `wc`, `find`, `grep`, `git branch`) is already covered by Claude Code's built-in read-only auto-allow list.
- Open item: activation preamble could be removed by adding `eval "$(fnm env --use-on-cd)"` and `eval "$(rbenv init -)"` to the shell profile (`~/.zshrc`) — not yet done, since that's outside the project directory.

## 2026-08-02 22:16 KST — Commit and push Step 1 work to V1 branch

- Read the user-supplied `CLAUDE.md` (agent working agreement: validate before every commit, one logical task per commit, no unrequested pushes/force-pushes/history rewrites) and the complete `docs/PRD.md` (sections 1–23), which superseded the earlier truncated `docs/prd-draft.md` (removed; `README.md`/`SECURITY.md` updated to point at `docs/PRD.md`).
- Created local branch `V1` off `main` (kept intentionally separate from `main` per instruction — no merging).
- Re-ran full validation (`pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm test`, `pnpm doctor`) — all green, including auto-formatting `CLAUDE.md`/`docs/PRD.md` to satisfy the repo's Prettier check.
- Committed in two logical commits:
  1. `c59f5fb` — Step 1 tooling, CI, and dev environment scaffold.
  2. `b5d352f` — `CLAUDE.md` and complete `docs/PRD.md`.
- Pushed `V1` to `origin/V1` (clean fast-forward, no force needed). `main` left untouched on both local and remote.

## 2026-08-02 22:16 KST — Step 1: Development environment & tooling setup

Scoped deliberately to tooling/config only — no React Native app code yet.

**Toolchain decision (ADR):** React Native 0.81.x target (exact patch TBD at app-scaffold time), Node 22 LTS, pnpm 10.x, Ruby 3.3.x, JDK 17, Xcode ≥ 16.1 — chosen based on what the project will need, not what happened to already be on the dev machine. Recorded in `docs/adr/0002-toolchain-baseline.md`.

**Repository foundations:**

- Monorepo skeleton per the architecture spec: `apps/`, `packages/{domain,analysis-engine,feedback-rules,local-database,design-system,shared-types,test-fixtures,tooling-smoke-test}/`, `native/{ios,android}-{swing-capture,pose-inference}/`, `models/{pose,club,phase-classifier,metadata}/`, `scripts/`, `docs/{adr,architecture,privacy,release,qa}/`.
- Version-pin files: `.nvmrc`, `.tool-versions`, `.ruby-version`, `package.json` (`packageManager`, `engines`), `.npmrc`, `pnpm-workspace.yaml`, `Gemfile`/`Gemfile.lock` (Ruby/Bundler only — CocoaPods/Fastlane deferred until there's an actual iOS project).
- TypeScript strict-mode base config, ESLint flat config, Prettier, `.editorconfig`, `.gitattributes`, `.gitignore`.
- A **real** workspace package, `packages/tooling-smoke-test`, with an actual Jest test — proves the pnpm workspace, TypeScript, ESLint, and test runner genuinely work, rather than relying on no-op CI steps.
- Governance files: `LICENSE` (proprietary/all-rights-reserved), `SECURITY.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS` (placeholder — needs a real GitHub handle), `.github/pull_request_template.md`, `.github/dependabot.yml`.
- CI workflow `.github/workflows/pr-checks.yml`: lint, format check, typecheck, test, `pnpm audit`, gitleaks secret scan. GitHub Actions pinned by version tag, not commit SHA yet (no network access available to resolve SHAs safely at the time — flagged as a follow-up, not silently done).
- `scripts/doctor.sh`: verifies a machine's installed toolchain against the repo's pins, reporting `OK`/`MISMATCH`/`MISSING` (Xcode/Android Studio correctly reported `MISSING` until manually installed).

**Local machine provisioned** (this dev machine): Watchman via Homebrew, rbenv + Ruby 3.3.12, fnm + Node 22.23.2, pnpm 10.34.5 via corepack. All version pins in the repo updated to match what was actually verified installed, not guessed.

**Bug found and fixed:** Jest hung indefinitely when its Watchman integration was enabled in this sandboxed environment; disabled via `watchman: false` in `packages/tooling-smoke-test/jest.config.mjs` (Jest's own file crawler is fast enough at this scale).

**Full verification passed:** `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm test`, `pnpm doctor` all green.

**Known open items (not yet done, intentionally not glossed over):**

- `.github/CODEOWNERS` has a placeholder owner (`@TODO-set-owner`) — needs the real GitHub handle.
- CI Actions pinned by tag, not commit SHA — needs network access to resolve real SHAs safely.
- Xcode and Android Studio/JDK 17 are manual installs on the dev machine — not yet done.
- React Native version (0.81.x) and Android compile/target SDK need re-confirmation as still current before Step 2 (app scaffolding) begins.

---

## Next up

Every MVP-scope item (PRD 3.1's 24-item list) that's genuinely buildable without a physical device or Phase 2 pose data is now done. What's left in `Checklist.md`'s MVP tracker either needs a physical device (camera/pose items), Phase 2 analysis data (skeleton overlay, joint angles, phase detection, feedback, metric deltas), or is a smaller polish item (the tab-bar icon gap from Step 12, landscape recording mode, wiring the frame-rate selector to an actual device format). Worth checking with the user on priority: continue with polish items, or treat this as a natural pause point for Phase 1/thin-Phase-2 work and wait for real device access.
