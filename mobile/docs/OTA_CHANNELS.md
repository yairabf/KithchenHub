# OTA Update Channels (develop / main)

This document describes the OTA update channel strategy and one-time EAS setup so updates reach the correct builds.

## Channel summary

| Channel   | Environment        | Build profile | Use case                    |
|-----------|--------------------|---------------|-----------------------------|
| **develop** | Staging and testing | `preview`     | Internal builds, QA, staging |
| **main**    | Production users   | `production`  | App Store / Play Store      |

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

## References

- [Manage branches and channels with EAS CLI](https://docs.expo.dev/eas-update/eas-cli/)
- [Using EAS Update](https://docs.expo.dev/build/updates/)
- [mobile/README.md](../README.md) — OTA Updates and EAS Build sections
