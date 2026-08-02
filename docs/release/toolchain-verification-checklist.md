# Toolchain verification checklist

Run once per development machine, and again whenever `docs/architecture/toolchain.md` changes.

1. Run `pnpm doctor` (or `bash scripts/doctor.sh` directly) and resolve every `MISMATCH`.
2. Confirm `node -v` matches `.nvmrc`.
3. Confirm `pnpm -v` matches the `packageManager` field in root `package.json`.
4. Confirm `ruby -v` matches `.ruby-version` (via rbenv, not system Ruby).
5. Confirm `bundle -v` runs and `bundle install` succeeds against the repo `Gemfile`.
6. Confirm `watchman -v` runs.
7. iOS only: confirm `xcodebuild -version` meets the minimum in `docs/architecture/toolchain.md`; record the actual installed version there.
8. Android only: confirm JDK 17 is what Gradle actually resolves (not just what's on `PATH`) and Android Studio / SDK are installed; record the actual installed compile/target SDK versions once Step 2 sets them.
9. Record the outcome (pass/fail per item, date, machine) below.

## Verification log

| Date       | Machine                      | Result  | Notes                                                                                                   |
| ---------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| 2026-08-02 | (this session's dev machine) | Partial | See `scripts/doctor.sh` output. Xcode/Android Studio not installed — expected, manual step outstanding. |
