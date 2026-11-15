# Verification — 0.6.0

15 November 2026.

- 84 recorded regression checks passed across Chromium and Playwright WebKit on Windows.
- 6 native-bridge tests passed, using mocked Capacitor native APIs. These validate backup restore, ordered saves/reset, lifecycle pause, Android Back and external source links.
- TypeScript validation and content checks passed for all 115 entries and 30 collections.
- Android Gradle release compilation: passed. Signed APK verified with the same certificate as 0.5.0; package com.erth.jigsaw, version code 11. All 115 images and the bundled game source were compared against the build output.
- iOS Xcode compilation: not performed locally (Windows host); a macOS workflow is included.
- Physical Android/iOS device and native emulator tests: not performed for this version.

The browser results do not establish native iPhone compatibility. Native build results must be checked separately. Existing reports under the older `verification/` root belong to prior releases. New compact reports are under `verification/0.6.0/`.
