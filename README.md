# Earth Legacy v0.5.0

Android puzzle game. Source files are in `app/web` and `app/android`.

## Web preview
From the repository root run `python -m http.server 8000 --directory app/web`, then open http://localhost:8000.

## Android build
The existing Windows build script is `app/build_apk.py`. It expects a JDK, Android SDK build tools and platform under `work/android-tools`, following the paths in the script. These tools are not bundled.

Signing keys are intentionally excluded. Supply your own keystore at `app/build/prototype.keystore` and set EARTH_KEYSTORE_PASSWORD and EARTH_KEY_PASSWORD in your local environment before building. Updating the original installed APK requires its original signing key.

See `app/README_AR.md` and `app/RELEASE_NOTES_050_AR.md` for Arabic documentation. Historical verification reports are in `verification`; they are not new test results. Preserve the asset notices and provenance files under `app/web`.
