import type { TFunction } from 'i18next';

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

/** i18n keys for unit labels. */
export const UNIT_LABEL_KEYS: Record<UnitCode, string> = {
  g: 'form.units.g',
  kg: 'form.units.kg',
  oz: 'form.units.oz',
  lb: 'form.units.lb',
  ml: 'form.units.ml',
  l: 'form.units.l',
  tsp: 'form.units.tsp',
  tbsp: 'form.units.tbsp',
  cup: 'form.units.cup',
  piece: 'form.units.piece',
  clove: 'form.units.clove',
  slice: 'form.units.slice',
  bunch: 'form.units.bunch',
  can: 'form.units.can',
  bottle: 'form.units.bottle',
  packet: 'form.units.packet',
  stick: 'form.units.stick',
};

/**
 * Returns localized label for a unit code, or the code itself if no translation helper is provided.
 */
export function getUnitLabel(code: string, t?: TFunction<'recipes'>): string {
  const key = UNIT_LABEL_KEYS[code as UnitCode];
  if (!key) return code;
  return t ? t(key) : code;
}
