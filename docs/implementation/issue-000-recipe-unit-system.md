# Implementation: Issue #000 - Recipe Ingredient Unit System

## Overview
Introduced a canonical unit system for recipe ingredients to improve validation, consistency, and shopping list integration. The update adds structured fields for amount, unit code, and unit type while preserving legacy `quantity` and `unit` for backward compatibility.

## Solution Approach
- Added a canonical unit vocabulary (`UnitType`, `UnitCode`) and a mapping table to validate unit/type matches.
- Extended recipe DTO validation with explicit amount and unit rules, including nested validation for ingredients and instructions.
- Normalized recipe responses to include canonical fields while keeping legacy fields deprecated.
- Updated shopping list item creation to prefer canonical unit fields.
- Provided a one-off migration script to backfill canonical unit fields for existing recipes.

## Architecture

### Component Structure
```
backend/src/modules/recipes/
├── constants/
│   ├── index.ts
│   └── units.constants.ts
├── dtos/
│   ├── create-recipe.dto.ts
│   └── recipe-detail-response.dto.ts
├── services/
│   └── recipes.service.ts
├── utils/
│   └── unit-converter.ts
└── validators/
    └── unit-type-validator.ts

backend/src/infrastructure/database/scripts/
└── migrate-recipe-units.ts
```

### Data Flow
1. Client submits ingredients with `quantityAmount`, `quantityUnit`, `quantityUnitType`, and optional `quantityModifier`.
2. DTO validation enforces unit/type compatibility and positive amounts for weight or volume.
3. Service maps ingredient records to normalized response fields, preserving legacy fields when present.
4. Shopping list items are created using canonical unit fields when available.
5. Migration script backfills canonical fields for existing recipes with legacy data.

### Key Components

#### Unit Constants
- **Purpose**: Canonical vocabulary for ingredient units and unit types.
- **Responsibilities**: Define stable unit codes and validate unit-type relationships.
- **Dependencies**: None.

#### DTO Validation
- **Purpose**: Enforce ingredient shape and rules at the API boundary.
- **Responsibilities**: Validate amounts, unit codes, and unit types; support legacy fields.
- **Dependencies**: `class-validator`, `class-transformer`.

#### Recipe Mapping
- **Purpose**: Normalize ingredient data for API responses and downstream consumers.
- **Responsibilities**: Populate canonical fields, preserve legacy fields, and keep responses consistent.
- **Dependencies**: Recipes service mapping logic.

#### Migration Script
- **Purpose**: Backfill canonical fields for existing recipe ingredients.
- **Responsibilities**: Map legacy `quantity` and `unit` into canonical fields, infer unit type.
- **Dependencies**: Prisma client, unit constants.

## Implementation Details

### Models
Canonical ingredient fields:
- `quantityAmount?: number`
- `quantityUnit?: UnitCode`
- `quantityUnitType?: UnitType`
- `quantityModifier?: string`
- Legacy fields remain available: `quantity?: number`, `unit?: string`

### Business Logic
- Validator enforces `quantityAmount` presence and positivity for weight or volume units.
- Unit/type mismatch is rejected.
- Mapping prefers canonical values and falls back to legacy fields.

### Data Access
- Recipes service now normalizes ingredient fields before returning responses.
- Shopping list items use canonical fields if present.

### Validation
- Unit/type matching: `IsValidUnitTypeMatch`.
- Positive amount for measured units: `HasPositiveAmountWhenMeasured`.
- Required amount for measured units: `IngredientAmountRequiredForMeasured`.

## Security Measures
- Input validation with `class-validator` on DTOs.
- No auth or authorization changes.

## Performance Optimizations
- No material performance changes.

## Testing
- Unit tests for unit constants and converter logic.
- DTO validation tests for valid and invalid ingredient shapes.
- Controller tests for new ingredient fields.
- Service tests for mapping and response shape.

## Configuration
No new environment variables or configuration changes.

## Dependencies
No new dependencies added.

## Breaking Changes
None. Legacy `quantity` and `unit` are still accepted and returned, but are deprecated.

## Migration Notes
Run the migration once after deploying the new unit system:
```
cd backend
npx ts-node -r tsconfig-paths/register src/infrastructure/database/scripts/migrate-recipe-units.ts
```

## Known Issues
None.

## Future Enhancements
- Deprecate and remove legacy `quantity` and `unit` fields after client migration.
- Add richer unit display formatting on the client.

## References
- Implementation files in `backend/src/modules/recipes/`
- Migration script in `backend/src/infrastructure/database/scripts/migrate-recipe-units.ts`
