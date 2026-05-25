# 2026-05-25 Store release versioning documentation update

## Scope
Documented the QA-passed `fix/store-release-versioning` branch / commit `b06a087`, which fixes stale iOS store marketing version handling and adds manual production store listing asset automation.

## Sources inspected
- Kanban task `t_1a341e2f` coder/reviewer/QA handoffs.
- `version.json`
- `mobile/scripts/store-release-version.js`
- `mobile/scripts/__tests__/store-release-version.test.js`
- `mobile/fastlane/Fastfile`
- `mobile/fastlane/STORE_ASSETS.md`
- `.github/workflows/mobile-native-store-release.yml`
- `.github/workflows/mobile-store-assets.yml`
- `mobile/package.json` and root `package.json` release scripts.
- Existing docs: `mobile/README.md`, `docs/project/STORE_COMPLIANCE.md`, `docs/project/RELEASE_STATUS.md`, `docs/project/RECENT_CHANGES.md`, `.hermes/PROJECT_CONTEXT.md`, `docs/project/DOCUMENTATION_MAP.md`.

## Docs changed
- `CHANGELOG.md`
- `AGENTS.md`
- `docs/project/DOCUMENTATION_MAP.md`
- `docs/project/RECENT_CHANGES.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/project/STORE_COMPLIANCE.md`
- `.hermes/PROJECT_CONTEXT.md`
- `/mnt/obsidian-vault/Projects/KitchenHub/README.md`

## Verification
- Documentation claims were grounded in the source files above and the reviewer/QA evidence on Kanban task `t_1a341e2f`.
- This docs pass did not run live Fastlane, App Store Connect, Google Play, or GitHub Actions workflows.

## Open questions / limits
- Live Fastlane/store API execution remains unverified until approved on a credentialed runner.
- The branch was local-only at QA time; do not describe the fix as merged, deployed, or store-uploaded until that happens.
- Verify deployed `/support` returns HTTP 200 before uploading store metadata that depends on the support URL.
