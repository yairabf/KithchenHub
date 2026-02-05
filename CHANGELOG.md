# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Canonical recipe unit system with `UnitType`, `UnitCode`, and unit-to-type mapping.
- Unit conversion utility for normalizing weight and volume units, plus conversion tests.
- Ingredient unit validation constraints for amount requirements and unit/type matching.
- Migration script to backfill legacy ingredient units into canonical unit fields.
- Unit-focused tests covering constants, DTO validation, and controller behavior.

### Changed

- Recipe create DTO to accept `quantityAmount`, `quantityUnit`, `quantityUnitType`, and `quantityModifier` with nested validation.
- Recipe detail DTO to return the new quantity fields while keeping legacy `quantity` and `unit` (deprecated).
- Recipe service mapping to normalize ingredient shapes and shopping list item creation to prefer canonical unit fields.

