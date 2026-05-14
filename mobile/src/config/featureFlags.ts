function isEnabled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export const featureFlags = {
  /**
   * Premium UI is intentionally hidden in production until the full purchase
   * flow is ready. Set EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE=true for internal
   * builds when testing the existing placeholder/paywall screens.
   */
  premiumSettingsSurface: isEnabled(
    process.env.EXPO_PUBLIC_ENABLE_PREMIUM_SURFACE,
  ),
};
