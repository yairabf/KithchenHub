describe('resolveApiBaseUrl', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
    jest.resetModules();
  });

  describe.each([
    ['unset', undefined, 'http://localhost:3000'],
    ['empty string', '', 'http://localhost:3000'],
    ['whitespace only', '   ', 'http://localhost:3000'],
    ['trims and strips trailing slash', ' https://api.example.com/ ', 'https://api.example.com'],
    ['no trailing slash', 'https://api.example.com', 'https://api.example.com'],
  ])('when EXPO_PUBLIC_API_URL is %s', (_, envValue, expected) => {
    it(`returns ${expected}`, () => {
      jest.resetModules();
      if (envValue === undefined) {
        delete process.env.EXPO_PUBLIC_API_URL;
      } else {
        process.env.EXPO_PUBLIC_API_URL = envValue;
      }
      const { resolveApiBaseUrl } = require('./apiBaseUrl');
      expect(resolveApiBaseUrl()).toBe(expected);
    });
  });
});
