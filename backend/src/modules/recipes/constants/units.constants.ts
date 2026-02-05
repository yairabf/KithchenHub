/**
 * Canonical unit system for recipe ingredients.
 * Unit codes are stable (no renames). UnitType validates which units are allowed.
 */
export enum UnitType {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  COUNT = 'count',
}

export enum UnitCode {
  // Weight
  GRAM = 'g',
  KILOGRAM = 'kg',
  OUNCE = 'oz',
  POUND = 'lb',
  // Volume
  MILLILITER = 'ml',
  LITER = 'l',
  TEASPOON = 'tsp',
  TABLESPOON = 'tbsp',
  CUP = 'cup',
  // Count
  PIECE = 'piece',
  CLOVE = 'clove',
  SLICE = 'slice',
  BUNCH = 'bunch',
  CAN = 'can',
  BOTTLE = 'bottle',
  PACKET = 'packet',
  STICK = 'stick',
}

/**
 * Maps each UnitCode to its UnitType. Single source of truth for validating that a unit
 * belongs to the given unit type (e.g. weight, volume, count).
 */
export const UNIT_TYPE_MAPPING: Record<UnitCode, UnitType> = {
  [UnitCode.GRAM]: UnitType.WEIGHT,
  [UnitCode.KILOGRAM]: UnitType.WEIGHT,
  [UnitCode.OUNCE]: UnitType.WEIGHT,
  [UnitCode.POUND]: UnitType.WEIGHT,
  [UnitCode.MILLILITER]: UnitType.VOLUME,
  [UnitCode.LITER]: UnitType.VOLUME,
  [UnitCode.TEASPOON]: UnitType.VOLUME,
  [UnitCode.TABLESPOON]: UnitType.VOLUME,
  [UnitCode.CUP]: UnitType.VOLUME,
  [UnitCode.PIECE]: UnitType.COUNT,
  [UnitCode.CLOVE]: UnitType.COUNT,
  [UnitCode.SLICE]: UnitType.COUNT,
  [UnitCode.BUNCH]: UnitType.COUNT,
  [UnitCode.CAN]: UnitType.COUNT,
  [UnitCode.BOTTLE]: UnitType.COUNT,
  [UnitCode.PACKET]: UnitType.COUNT,
  [UnitCode.STICK]: UnitType.COUNT,
};
