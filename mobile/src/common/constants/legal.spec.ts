describe('legal URL constants', () => {
  const originalPrivacy = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  const originalTerms = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL;
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (originalPrivacy === undefined) {
      delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
    } else {
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = originalPrivacy;
    }
    if (originalTerms === undefined) {
      delete process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL;
    } else {
      process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL = originalTerms;
    }
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
    jest.resetModules();
  });

  describe.each([
    ['unset', undefined, 'http://localhost:3000/privacy'],
    ['empty string', '', 'http://localhost:3000/privacy'],
    ['whitespace only', '   ', 'http://localhost:3000/privacy'],
    [
      'custom URL',
      'https://legal.example.com/privacy',
      'https://legal.example.com/privacy',
    ],
  ])('PRIVACY_POLICY_URL when EXPO_PUBLIC_PRIVACY_POLICY_URL is %s', (_, envValue, expected) => {
    it(`resolves to ${expected}`, () => {
      jest.resetModules();
      delete process.env.EXPO_PUBLIC_API_URL;
      if (envValue === undefined) {
        delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
      } else {
        process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = envValue;
      }
      const { PRIVACY_POLICY_URL } = require('./legal');
      expect(PRIVACY_POLICY_URL).toBe(expected);
    });
  });

  it('defaults privacy to API base + /privacy when EXPO_PUBLIC_API_URL is set', () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';
    const { PRIVACY_POLICY_URL } = require('./legal');
    expect(PRIVACY_POLICY_URL).toBe('https://api.example.com/privacy');
  });

  describe.each([
    ['unset', undefined, 'http://localhost:3000/terms'],
    ['empty string', '', 'http://localhost:3000/terms'],
    ['whitespace only', '   ', 'http://localhost:3000/terms'],
    [
      'custom URL',
      'https://legal.example.com/terms',
      'https://legal.example.com/terms',
    ],
  ])('TERMS_OF_SERVICE_URL when EXPO_PUBLIC_TERMS_OF_SERVICE_URL is %s', (_, envValue, expected) => {
    it(`resolves to ${expected}`, () => {
      jest.resetModules();
      delete process.env.EXPO_PUBLIC_API_URL;
      if (envValue === undefined) {
        delete process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL;
      } else {
        process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL = envValue;
      }
      const { TERMS_OF_SERVICE_URL } = require('./legal');
      expect(TERMS_OF_SERVICE_URL).toBe(expected);
    });
  });

  it('defaults terms to API base + /terms when EXPO_PUBLIC_API_URL is set', () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
    const { TERMS_OF_SERVICE_URL } = require('./legal');
    expect(TERMS_OF_SERVICE_URL).toBe('https://api.example.com/terms');
  });
});
