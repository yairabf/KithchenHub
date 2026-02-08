/**
 * Tests for input sanitization helpers (stripToDigitsOnly, stripToNumeric).
 */

import { stripToDigitsOnly, stripToNumeric } from '../inputSanitization';

describe('stripToDigitsOnly', () => {
  describe.each([
    ['empty string', '', ''],
    ['digits only', '123', '123'],
    ['with letters', '12ab34', '1234'],
    ['with spaces and units', '30 mins', '30'],
    ['mixed symbols', '1-2.3', '123'],
    ['only non-digits', 'abc', ''],
    ['leading zeros', '007', '007'],
  ])('with %s', (_description, input, expected) => {
    it(`returns "${expected}" for "${input}"`, () => {
      expect(stripToDigitsOnly(input)).toBe(expected);
    });
  });
});

describe('stripToNumeric', () => {
  describe.each([
    ['empty string', '', ''],
    ['integer', '42', '42'],
    ['one decimal', '1.5', '1.5'],
    ['multiple decimals collapsed', '1.2.3', '1.23'],
    ['letters stripped', '1a.2b', '1.2'],
    ['leading decimal', '.5', '.5'],
    ['trailing decimal', '3.', '3.'],
    ['with units', '2.5 cups', '2.5'],
    ['only digits', '100', '100'],
    ['multiple dots mid-string', '1.2.3.4', '1.234'],
  ])('with %s', (_description, input, expected) => {
    it(`returns "${expected}" for "${input}"`, () => {
      expect(stripToNumeric(input)).toBe(expected);
    });
  });
});
