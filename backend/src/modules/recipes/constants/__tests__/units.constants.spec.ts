import { UnitCode, UnitType, UNIT_TYPE_MAPPING } from '../units.constants';

describe('Unit Constants', () => {
  describe('UNIT_TYPE_MAPPING', () => {
    it('should map weight units to UnitType.WEIGHT', () => {
      expect(UNIT_TYPE_MAPPING[UnitCode.GRAM]).toBe(UnitType.WEIGHT);
      expect(UNIT_TYPE_MAPPING[UnitCode.KILOGRAM]).toBe(UnitType.WEIGHT);
      expect(UNIT_TYPE_MAPPING[UnitCode.OUNCE]).toBe(UnitType.WEIGHT);
      expect(UNIT_TYPE_MAPPING[UnitCode.POUND]).toBe(UnitType.WEIGHT);
    });

    it('should map volume units to UnitType.VOLUME', () => {
      expect(UNIT_TYPE_MAPPING[UnitCode.MILLILITER]).toBe(UnitType.VOLUME);
      expect(UNIT_TYPE_MAPPING[UnitCode.LITER]).toBe(UnitType.VOLUME);
      expect(UNIT_TYPE_MAPPING[UnitCode.TEASPOON]).toBe(UnitType.VOLUME);
      expect(UNIT_TYPE_MAPPING[UnitCode.TABLESPOON]).toBe(UnitType.VOLUME);
      expect(UNIT_TYPE_MAPPING[UnitCode.CUP]).toBe(UnitType.VOLUME);
    });

    it('should map count units to UnitType.COUNT', () => {
      expect(UNIT_TYPE_MAPPING[UnitCode.PIECE]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.CLOVE]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.SLICE]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.BUNCH]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.CAN]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.BOTTLE]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.PACKET]).toBe(UnitType.COUNT);
      expect(UNIT_TYPE_MAPPING[UnitCode.STICK]).toBe(UnitType.COUNT);
    });

    it('should have an entry for every UnitCode', () => {
      const codes = Object.values(UnitCode);
      codes.forEach((code) => {
        expect(UNIT_TYPE_MAPPING[code]).toBeDefined();
        expect([UnitType.WEIGHT, UnitType.VOLUME, UnitType.COUNT]).toContain(
          UNIT_TYPE_MAPPING[code],
        );
      });
    });
  });

  describe('UnitCode', () => {
    it('should use stable string values for unit codes', () => {
      expect(UnitCode.GRAM).toBe('g');
      expect(UnitCode.CUP).toBe('cup');
      expect(UnitCode.PIECE).toBe('piece');
    });
  });
});
