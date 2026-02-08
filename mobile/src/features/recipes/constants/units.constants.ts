/**
 * Unit catalog for recipe ingredients. Codes align with backend UnitCode
 * so submitted unit values are valid. Used by UnitPicker and display.
 */
export type UnitType = 'weight' | 'volume' | 'count';

/** Stable unit codes; must match backend UnitCode values. */
export type UnitCode =
  | 'g'
  | 'kg'
  | 'oz'
  | 'lb'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'piece'
  | 'clove'
  | 'slice'
  | 'bunch'
  | 'can'
  | 'bottle'
  | 'packet'
  | 'stick';

/** Units grouped by type for filter + list UX. */
export const UNITS_BY_TYPE: Record<UnitType, readonly UnitCode[]> = {
  weight: ['g', 'kg', 'oz', 'lb'],
  volume: ['ml', 'l', 'tsp', 'tbsp', 'cup'],
  count: ['piece', 'clove', 'slice', 'bunch', 'can', 'bottle', 'packet', 'stick'],
};

/** Optional display labels; fallback to code if missing. */
export const UNIT_LABELS: Partial<Record<UnitCode, string>> = {
  g: 'gram',
  kg: 'kilogram',
  oz: 'ounce',
  lb: 'pound',
  ml: 'milliliter',
  l: 'liter',
  tsp: 'teaspoon',
  tbsp: 'tablespoon',
  cup: 'cup',
  piece: 'piece',
  clove: 'clove',
  slice: 'slice',
  bunch: 'bunch',
  can: 'can',
  bottle: 'bottle',
  packet: 'packet',
  stick: 'stick',
};

/**
 * Returns display label for a unit code, or the code itself if no label.
 */
export function getUnitLabel(code: string): string {
  return UNIT_LABELS[code as UnitCode] ?? code;
}
