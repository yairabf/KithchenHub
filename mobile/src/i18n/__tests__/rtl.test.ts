import { isRtlLanguage } from '../rtl';

describe('isRtlLanguage', () => {
  describe.each([
    ['en', false],
    ['es', false],
    ['fr', false],
  ])('LTR locale %s', (locale, expected) => {
    it(`should return ${expected}`, () => {
      expect(isRtlLanguage(locale)).toBe(expected);
    });
  });

  describe.each([
    ['he', true],
    ['ar', true],
    ['he-IL', true],
    ['ar-SA', true],
  ])('RTL locale %s', (locale, expected) => {
    it(`should return ${expected}`, () => {
      expect(isRtlLanguage(locale)).toBe(expected);
    });
  });

  describe.each([
    ['empty string', '', false],
    ['invalid locale', 'xx', false],
  ])('edge case: %s', (_description, input, expected) => {
    it(`should return ${expected}`, () => {
      expect(isRtlLanguage(input)).toBe(expected);
    });
  });

  it('should return false for null', () => {
    expect(isRtlLanguage(null as unknown as string)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isRtlLanguage(undefined as unknown as string)).toBe(false);
  });
});
