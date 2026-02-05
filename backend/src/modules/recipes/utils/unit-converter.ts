import { UnitCode, UnitType } from '../constants/units.constants';

/**
 * Converts measurable units to a canonical base for search/analytics.
 * Weights → grams, volumes → ml. Count units are not normalized.
 */
export class UnitConverter {
  private static readonly WEIGHT_TO_GRAMS: Record<string, number> = {
    [UnitCode.GRAM]: 1,
    [UnitCode.KILOGRAM]: 1000,
    [UnitCode.OUNCE]: 28.3495,
    [UnitCode.POUND]: 453.592,
  };

  private static readonly VOLUME_TO_ML: Record<string, number> = {
    [UnitCode.MILLILITER]: 1,
    [UnitCode.LITER]: 1000,
    [UnitCode.TEASPOON]: 4.92892,
    [UnitCode.TABLESPOON]: 14.7868,
    [UnitCode.CUP]: 236.588,
  };

  /**
   * Normalize amount to base unit (grams for weight, ml for volume).
   *
   * @param amount - Numeric quantity in the given unit
   * @param unit - Unit code (e.g. g, cup, piece)
   * @param unitType - Type of measurement (weight, volume, or count)
   * @returns Normalized amount in grams (weight) or ml (volume), or null for count units
   *   or when unit/unitType are mismatched or unknown
   */
  static normalize(
    amount: number,
    unit: UnitCode,
    unitType: UnitType,
  ): number | null {
    if (unitType === UnitType.COUNT) {
      return null;
    }

    if (unitType === UnitType.WEIGHT) {
      const factor = this.WEIGHT_TO_GRAMS[unit];
      return factor != null ? amount * factor : null;
    }

    if (unitType === UnitType.VOLUME) {
      const factor = this.VOLUME_TO_ML[unit];
      return factor != null ? amount * factor : null;
    }

    return null;
  }
}
