describe('featureFlags', () => {
  const originalPremiumSurface = process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE;

  afterEach(() => {
    if (originalPremiumSurface === undefined) {
      delete process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE;
    } else {
      process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE = originalPremiumSurface;
    }
    jest.resetModules();
  });

  it('keeps the premium settings surface disabled by default', () => {
    delete process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE;
    jest.resetModules();

    const { featureFlags } = require('./featureFlags');

    expect(featureFlags.premiumSettingsSurface).toBe(false);
  });

  it.each(['1', 'true', 'TRUE', 'yes', 'on'])(
    'enables the premium settings surface when env value is %s',
    (value) => {
      process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE = value;
      jest.resetModules();

      const { featureFlags } = require('./featureFlags');

      expect(featureFlags.premiumSettingsSurface).toBe(true);
    },
  );

  it.each(['0', 'false', 'no', 'off', ''])(
    'keeps the premium settings surface disabled when env value is %s',
    (value) => {
      process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE = value;
      jest.resetModules();

      const { featureFlags } = require('./featureFlags');

      expect(featureFlags.premiumSettingsSurface).toBe(false);
    },
  );
});
