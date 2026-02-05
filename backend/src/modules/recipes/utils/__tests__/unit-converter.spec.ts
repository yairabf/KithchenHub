import { UnitConverter } from '../unit-converter';
import { UnitCode, UnitType } from '../../constants/units.constants';

describe('UnitConverter', () => {
  describe('Weight conversions', () => {
    it('should convert grams to grams (identity)', () => {
      expect(UnitConverter.normalize(100, UnitCode.GRAM, UnitType.WEIGHT)).toBe(
        100,
      );
    });

    it('should convert kilograms to grams', () => {
      expect(
        UnitConverter.normalize(1, UnitCode.KILOGRAM, UnitType.WEIGHT),
      ).toBe(1000);
    });

    it('should convert ounces to grams', () => {
      expect(
        UnitConverter.normalize(1, UnitCode.OUNCE, UnitType.WEIGHT),
      ).toBeCloseTo(28.3495, 2);
    });

    it('should convert pounds to grams', () => {
      expect(
        UnitConverter.normalize(1, UnitCode.POUND, UnitType.WEIGHT),
      ).toBeCloseTo(453.592, 2);
    });
  });

  describe('Volume conversions', () => {
    it('should convert milliliters correctly (identity)', () => {
      expect(
        UnitConverter.normalize(250, UnitCode.MILLILITER, UnitType.VOLUME),
      ).toBe(250);
    });

    it('should convert liters to ml', () => {
      expect(UnitConverter.normalize(1, UnitCode.LITER, UnitType.VOLUME)).toBe(
        1000,
      );
    });

    it('should convert cups to ml', () => {
      expect(
        UnitConverter.normalize(1, UnitCode.CUP, UnitType.VOLUME),
      ).toBeCloseTo(236.588, 2);
    });

    it('should convert tablespoons to ml', () => {
      expect(
        UnitConverter.normalize(1, UnitCode.TABLESPOON, UnitType.VOLUME),
      ).toBeCloseTo(14.7868, 2);
    });
  });

  describe('Count units', () => {
    it('should not normalize count units', () => {
      expect(
        UnitConverter.normalize(2, UnitCode.PIECE, UnitType.COUNT),
      ).toBeNull();
    });

    it('should return null for clove', () => {
      expect(
        UnitConverter.normalize(3, UnitCode.CLOVE, UnitType.COUNT),
      ).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should return null when unit type is weight but unit is a count unit (mismatch)', () => {
      expect(
        UnitConverter.normalize(1, UnitCode.PIECE, UnitType.WEIGHT),
      ).toBeNull();
    });

    it('should return null when unit type is volume but unit is a weight unit (mismatch)', () => {
      expect(
        UnitConverter.normalize(100, UnitCode.GRAM, UnitType.VOLUME),
      ).toBeNull();
    });
  });
});
