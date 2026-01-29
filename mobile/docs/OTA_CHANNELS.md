# OTA Update Channels (develop / main)

This document describes the OTA update channel strategy and one-time EAS setup so updates reach the correct builds.

## Channel summary

| Channel   | Environment        | Build profile | Use case                    |
|-----------|--------------------|---------------|-----------------------------|
| **develop** | Staging and testing | `preview`     | Internal builds, QA, staging |
| **main**    | Production users   | `production`  | App Store / Play Store      |

Production builds (`eas build --profile production`) are for App Store and Google Play submission and use channel **main**. For credentials, first-time setup, and store submission, see the mobile [README EAS Build — Production build profile (store submissions)](../README.md#production-build-profile-store-submissions).

- **preview** profile builds (`eas build --profile preview`) use channel **develop** and receive updates published to the `develop` branch.
- **production** profile builds (`eas build --profile production`) use channel **main** and receive updates published to the `main` branch.

## One-time channel and branch setup

Run these from the **mobile** directory after `eas login` and `eas init`:

1. **Create channels** (if they do not already exist):

   ```bash
   eas channel:create develop
   eas channel:create main
   ```

2. **Verify channels:**

   ```bash
   eas channel:list
   eas channel:view develop
   eas channel:view main
   ```

3. **Link branches to channels:** In the [Expo dashboard](https://expo.dev) for your project, open **Updates** and link:
   - Channel **develop** → branch **develop** (or create branch `develop` and link it).
   - Channel **main** → branch **main** (or create branch `main` and link it).

   Alternatively, publishing an update to a branch with `eas update --branch <name>` can create the branch; then link the channel to that branch in the dashboard.

## Publishing updates

- **Staging / testing:** Publish to the develop channel’s branch so preview builds receive the update:

  ```bash
  eas update --branch develop --message "Your message"
  ```

  Or with Git auto-fill:

  ```bash
  eas update --branch develop --auto
  ```

- **Production:** Publish to the main channel’s branch so store builds receive the update:

  ```bash
  eas update --branch main --message "Your message"
  eas update --branch main --auto
  ```

Only JS/asset changes are delivered via OTA. Native or dependency changes require a new build and a version bump in **version.json** (see README OTA section).

## Installing preview builds on real devices

Preview builds (staging) are installable on real devices without the App Store or Play Store:

- **Android:** Builds are APKs. After running `eas build --profile preview --platform android`, open the build page URL on the device (or scan the QR code from the [Expo dashboard](https://expo.dev)) to download and install.
- **iOS:** Register each test device with `eas device:create` so its UDID is included in the ad hoc provisioning profile. Then run `eas build --profile preview --platform ios` and install from the build URL. New devices require a new build (or re-signing) to be added to the profile.

See [Expo Internal distribution](https://docs.expo.dev/build/internal-distribution/) and the mobile README (EAS Build → Internal distribution) for more detail.

## References

- [Manage branches and channels with EAS CLI](https://docs.expo.dev/eas-update/eas-cli/)
- [Using EAS Update](https://docs.expo.dev/build/updates/)
- [mobile/README.md](../README.md) — OTA Updates and EAS Build sections
