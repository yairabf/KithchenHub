# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Fastlane store-release version validation script and tests to fail early when `version.json` is stale or not greater than the current store version.
- Manual store listing asset upload workflow and Fastlane lanes for App Store / Google Play metadata and screenshots without binary upload or production rollout.
- Canonical recipe unit system with `UnitType`, `UnitCode`, and unit-to-type mapping.
- Unit conversion utility for normalizing weight and volume units, plus conversion tests.
- Ingredient unit validation constraints for amount requirements and unit/type matching.
- Migration script to backfill legacy ingredient units into canonical unit fields.
- Unit-focused tests covering constants, DTO validation, and controller behavior.
- Documented public, cache-optimized recipe image access via unguessable URLs.

### Changed

- Mobile store release automation now uses repo-root `version.json` as the iOS marketing version and Android `versionName`, increments iOS build numbers from TestFlight, and computes Android `versionCode` from existing Play track codes.
- Recipe create DTO to accept `quantityAmount`, `quantityUnit`, `quantityUnitType`, and `quantityModifier` with nested validation.
- Recipe detail DTO to return the new quantity fields while keeping legacy `quantity` and `unit` (deprecated).
- Recipe service mapping to normalize ingredient shapes and shopping list item creation to prefer canonical unit fields.
