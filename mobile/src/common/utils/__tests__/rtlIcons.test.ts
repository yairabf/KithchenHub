/**
 * Tests for getDirectionalIcon: LTR returns LTR name; RTL flips mapped icons; unmapped icons return as-is.
 */
jest.mock('react-native', () => {
  const rtlState = { isRTL: false };
  return {
    I18nManager: {
      get isRTL() {
        return rtlState.isRTL;
      },
      __testSetIsRTL: (v: boolean) => {
        rtlState.isRTL = v;
      },
    },
  };
});

const { getDirectionalIcon } = require('../rtlIcons');

const getRN = () =>
  require('react-native') as {
    I18nManager: { __testSetIsRTL: (v: boolean) => void };
  };

describe('getDirectionalIcon', () => {
  beforeEach(() => {
    getRN().I18nManager.__testSetIsRTL(false);
  });

  describe.each([
    ['arrow-back'],
    ['arrow-forward'],
    ['chevron-back'],
    ['chevron-forward'],
  ] as const)('when isRTL is false, %s returns as-is', (ltrIconName) => {
    it(`returns ${ltrIconName}`, () => {
      expect(getDirectionalIcon(ltrIconName)).toBe(ltrIconName);
    });
  });

  describe.each([
    ['arrow-back', 'arrow-forward'],
    ['arrow-forward', 'arrow-back'],
    ['chevron-back', 'chevron-forward'],
    ['chevron-forward', 'chevron-back'],
  ] as const)('when isRTL is true, %s flips to %s', (ltrIconName, expectedRtlName) => {
    it(`returns ${expectedRtlName}`, () => {
      getRN().I18nManager.__testSetIsRTL(true);
      expect(getDirectionalIcon(ltrIconName)).toBe(expectedRtlName);
    });
  });

  describe('unmapped icon names', () => {
    it('returns the same name in LTR', () => {
      expect(getDirectionalIcon('chevron-up')).toBe('chevron-up');
      expect(getDirectionalIcon('home-outline')).toBe('home-outline');
    });

    it('returns the same name in RTL when not in map', () => {
      getRN().I18nManager.__testSetIsRTL(true);
      expect(getDirectionalIcon('chevron-up')).toBe('chevron-up');
      expect(getDirectionalIcon('home-outline')).toBe('home-outline');
    });
  });
});
