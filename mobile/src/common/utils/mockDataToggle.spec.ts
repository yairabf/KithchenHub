import { isMockDataEnabled } from './mockDataToggle';

describe('isMockDataEnabled', () => {
  describe.each([
    ['true (lowercase)', 'true', true],
    ['true (uppercase)', 'TRUE', true],
    ['true with whitespace', '  true  ', true],
    ['false (lowercase)', 'false', false],
    ['false (uppercase)', 'FALSE', false],
    ['false with whitespace', '  false  ', false],
    ['undefined value', undefined, false],
    ['null value', null, false],
    ['empty string', '', false],
    ['non-boolean value', 'yes', false],
  ])('parsing: %s', (_label, value, expected) => {
    it(`returns ${expected}`, () => {
      expect(isMockDataEnabled(value)).toBe(expected);
    });
  });
});
