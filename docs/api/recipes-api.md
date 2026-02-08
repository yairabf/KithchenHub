# Recipes API - Ingredient Units

## Overview
This document describes the ingredient unit fields supported by the Recipes API. The API accepts canonical unit fields and still supports legacy `quantity` and `unit` for backward compatibility.

## Recipe Image Caching
- Image access is public via unguessable, versioned URLs to maximize caching.
- Image URLs are versioned via storage keys (e.g., `image_v{n}.webp`) so clients can cache aggressively.
- Uploaded images are stored with `Cache-Control: public, max-age=31536000, immutable`.
- Image URLs are signed; the default signed URL TTL is 7 days. URLs only change when the image version changes or the signed URL expires.
- Manual refresh in the app refetches recipe data. Images only change when the server returns a new version.

## Ingredient Fields
Canonical fields:
- `quantityAmount?: number` - The numeric amount.
- `quantityUnit?: string` - Unit code (examples: `g`, `kg`, `ml`, `tbsp`, `cup`, `piece`).
- `quantityUnitType?: string` - Unit type (one of `weight`, `volume`, `count`).
- `quantityModifier?: string` - Free-form modifier when no canonical unit applies (example: "pinch").

Legacy fields (deprecated):
- `quantity?: number`
- `unit?: string`

## POST /recipes

### Request Body (ingredient example)
```json
{
  "title": "Pasta",
  "ingredients": [
    {
      "name": "Flour",
      "quantityAmount": 500,
      "quantityUnit": "g",
      "quantityUnitType": "weight"
    },
    {
      "name": "Eggs",
      "quantityAmount": 2,
      "quantityUnit": "piece",
      "quantityUnitType": "count"
    }
  ],
  "instructions": [
    { "step": 1, "instruction": "Mix" }
  ]
}
```

### Validation Rules
- If `quantityUnitType` is `weight` or `volume`, `quantityAmount` must be present and greater than 0.
- If `quantityUnitType` is set, `quantityUnit` must match the unit type.
- Legacy `quantity` and `unit` are accepted but deprecated.

## GET /recipes/:id

### Response (ingredient example)
```json
{
  "id": "recipe-123",
  "title": "Pasta",
  "ingredients": [
    {
      "name": "Flour",
      "quantityAmount": 500,
      "quantityUnit": "g",
      "quantityUnitType": "weight",
      "quantity": 500,
      "unit": "g"
    }
  ]
}
```

## Migration
A one-off script exists to backfill canonical fields from legacy data:
- `backend/src/infrastructure/database/scripts/migrate-recipe-units.ts`
