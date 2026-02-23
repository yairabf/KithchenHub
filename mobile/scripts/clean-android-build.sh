#!/usr/bin/env bash
# Removes Android build and CMake cache dirs so the next build is fresh.
# Use this instead of ./gradlew clean: with the New Architecture, gradlew clean
# can fail because CMake expects codegen JNI dirs that are removed by clean.
# Run from repo root or mobile/: scripts/clean-android-build.sh
# Then run: npx expo run:android

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="${SCRIPT_DIR}/../android"
APP_BUILD="${ANDROID_DIR}/app/build"
APP_CXX="${ANDROID_DIR}/app/.cxx"
ROOT_BUILD="${ANDROID_DIR}/build"

for dir in "$APP_BUILD" "$APP_CXX" "$ROOT_BUILD"; do
  if [[ -d "$dir" ]]; then
    echo "Removing $dir"
    rm -rf "$dir"
  fi
done

echo "Android build dirs removed. Run: npx expo run:android"
