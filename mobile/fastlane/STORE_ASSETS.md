# Production store listing assets

This directory contains the Fastlane-managed production listing copy and screenshot assets used by the manual store-assets workflow.

Run intentionally; this is not part of the automatic main-merge store upload path:

```bash
npm run release:ios:store-assets
npm run release:android:store-assets
npm run release:stores:store-assets
```

The same lanes are exposed by `.github/workflows/mobile-store-assets.yml` via `workflow_dispatch`.

Notes:
- iOS metadata lives in `fastlane/metadata/ios/en-US/` and screenshots in `fastlane/screenshots/en-US/`.
- Google Play metadata and screenshots live in `fastlane/metadata/android/en-US/`.
- Verify `https://kithchensync1.vercel.app/support` returns HTTP 200 before uploading support URL metadata to either store.
- These lanes upload listing assets only; they do not upload binaries, submit App Store review, or roll out Google Play production releases.
