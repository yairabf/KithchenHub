/**
 * Input sanitization helpers for restricting text inputs to numeric values.
 * Used by forms (e.g. recipe prep time, quantity) to enforce digits-only or
 * decimal-number input without allowing letters or symbols.
 */

/**
 * Keeps only digit characters (0-9). Use for integer-only inputs (e.g. prep time in minutes).
 *
 * @param text - Raw input string from the user
 * @returns String containing only digits; empty string if none
 */
export function stripToDigitsOnly(text: string): string {
  return text.replace(/\D/g, '');
}

/**
 * Keeps only digits and at most one decimal point. Use for quantity inputs (e.g. "1.5" cups).
 * Multiple decimal points are collapsed to one (e.g. "1.2.3" → "1.23").
 *
 * @param text - Raw input string from the user
 * @returns String containing only digits and at most one decimal point
 */
export function stripToNumeric(text: string): string {
  const hasDecimal = /\./.test(text);
  const filtered = text.replace(hasDecimal ? /[^\d.]/g : /\D/g, '');
  if (!hasDecimal) return filtered;
  const parts = filtered.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;
}
