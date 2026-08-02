#!/usr/bin/env bash
# Reports how this machine's toolchain compares to the versions pinned in
# the repo (.nvmrc, .ruby-version, package.json). Missing native tooling
# (Xcode, Android Studio) is reported as MISSING, not treated as a failure —
# see docs/architecture/toolchain.md.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

STATUS=0
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

ok()      { printf "  ${GREEN}OK${RESET}       %s\n" "$1"; }
mismatch(){ printf "  ${RED}MISMATCH${RESET} %s\n" "$1"; STATUS=1; }
missing() { printf "  ${YELLOW}MISSING${RESET}  %s\n" "$1"; }
info()    { printf "  INFO     %s\n" "$1"; }

echo "Golf Swing App — toolchain doctor"
echo "=================================="

# Node
EXPECTED_NODE="$(tr -d '[:space:]' < .nvmrc)"
EXPECTED_NODE_MAJOR="${EXPECTED_NODE%%.*}"
if command -v node >/dev/null 2>&1; then
  ACTUAL_NODE="$(node -v)"
  ACTUAL_NODE_MAJOR="${ACTUAL_NODE#v}"
  ACTUAL_NODE_MAJOR="${ACTUAL_NODE_MAJOR%%.*}"
  if [ "$ACTUAL_NODE_MAJOR" = "$EXPECTED_NODE_MAJOR" ]; then
    ok "Node $ACTUAL_NODE (expected major $EXPECTED_NODE_MAJOR, .nvmrc pins $EXPECTED_NODE)"
  else
    mismatch "Node $ACTUAL_NODE installed, .nvmrc expects major $EXPECTED_NODE_MAJOR ($EXPECTED_NODE)"
  fi
else
  missing "Node not found on PATH"
fi

# pnpm / corepack
EXPECTED_PNPM_FULL="$(node -p "require('./package.json').packageManager" 2>/dev/null || echo "")"
EXPECTED_PNPM_VERSION="${EXPECTED_PNPM_FULL%%+*}"
if command -v pnpm >/dev/null 2>&1; then
  ACTUAL_PNPM="pnpm@$(pnpm --version)"
  if [ -n "$EXPECTED_PNPM_VERSION" ] && [ "$ACTUAL_PNPM" = "$EXPECTED_PNPM_VERSION" ]; then
    ok "pnpm matches packageManager pin ($ACTUAL_PNPM)"
  else
    mismatch "pnpm is $ACTUAL_PNPM, package.json packageManager expects $EXPECTED_PNPM_VERSION"
  fi
else
  missing "pnpm not found (run: corepack enable && corepack use \$(node -p \"require('./package.json').packageManager\"))"
fi

# Ruby
EXPECTED_RUBY="$(tr -d '[:space:]' < .ruby-version)"
if command -v ruby >/dev/null 2>&1; then
  ACTUAL_RUBY="$(ruby -e 'print RUBY_VERSION')"
  if [ "$ACTUAL_RUBY" = "$EXPECTED_RUBY" ]; then
    ok "Ruby $ACTUAL_RUBY"
  else
    mismatch "Ruby $ACTUAL_RUBY active, .ruby-version expects $EXPECTED_RUBY (check rbenv is shimmed into PATH)"
  fi
else
  missing "Ruby not found on PATH"
fi

# Bundler
if command -v bundle >/dev/null 2>&1; then
  ok "Bundler $(bundle -v)"
else
  missing "Bundler not found"
fi

# Watchman
if command -v watchman >/dev/null 2>&1; then
  ok "Watchman $(watchman -v)"
else
  missing "Watchman not found (run: brew install watchman)"
fi

# Java
if command -v java >/dev/null 2>&1; then
  info "Java: $(java -version 2>&1 | head -n1) — apps/mobile requires JDK 17 for Android Gradle builds; this is whatever's on PATH, not necessarily what Gradle will actually use (Android Studio installs its own)"
else
  missing "Java not found"
fi

# Xcode (macOS only)
if [ "$(uname)" = "Darwin" ]; then
  if command -v xcodebuild >/dev/null 2>&1 && xcodebuild -version >/dev/null 2>&1; then
    ok "$(xcodebuild -version | head -n1)"
  else
    missing "Xcode not found (install manually from the App Store — see docs/architecture/toolchain.md)"
  fi
fi

# Android SDK
if [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  ok "Android SDK env var set (ANDROID_HOME=${ANDROID_HOME:-} ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-})"
else
  missing "ANDROID_HOME / ANDROID_SDK_ROOT not set (install Android Studio, then set this)"
fi

# Git
if command -v git >/dev/null 2>&1; then
  ok "$(git --version)"
else
  mismatch "git not found"
fi

echo "=================================="
if [ "$STATUS" -eq 0 ]; then
  echo "No hard MISMATCHes. MISSING items above are expected until you complete manual installs (see docs/release/toolchain-verification-checklist.md)."
else
  echo "One or more MISMATCHes found — resolve before relying on this machine for release builds."
fi
exit "$STATUS"
