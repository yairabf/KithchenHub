/**
 * Determines whether mock data is enabled based on an environment flag.
 * @param envValue - Raw environment value (e.g., "true", "false", or undefined).
 * @returns True when the value is "true" (case-insensitive); otherwise false.
 */
export const isMockDataEnabled = (envValue?: string | null): boolean => {
  const normalizedValue = envValue?.trim().toLowerCase();
  return normalizedValue === 'true';
};
