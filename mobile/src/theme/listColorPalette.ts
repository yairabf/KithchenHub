import { colors } from './colors';

/**
 * Preset hex swatches for the shopping list accent color picker.
 *
 * All values must be 6-digit #RRGGBB — ShoppingListPanel renders
 * tints via `list.color + '20'` which requires this exact format.
 *
 * The first entry is `colors.shopping` so the default selection
 * in ShoppingListsScreen always matches a visible swatch.
 */
export const shoppingListPickerColors = [
  colors.shopping,
  colors.primaryDark,
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#65A30D',
  '#16A34A',
  '#059669',
  '#0D9488',
  '#0891B2',
  '#0284C7',
  '#2563EB',
  '#4F46E5',
  '#7C3AED',
  '#9333EA',
  '#C026D3',
  '#DB2777',
  '#BE123C',
  '#78716C',
  '#57534E',
  '#475569',
  '#0F766E',
] as const satisfies readonly string[];

/**
 * Parses a 6-digit hex color string into its RGB components.
 * Returns null for any value that does not match #RRGGBB (3-char
 * shorthand, rgba strings, and non-hex input are all rejected).
 */
export function parseHexRgb(hexColor: string): { r: number; g: number; b: number } | null {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/**
 * Computes the WCAG 2.1 relative luminance for an sRGB triplet.
 * Range: 0 (black) → 1 (white).
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminanceFromRgb(rgb: { r: number; g: number; b: number }): number {
  const linearize = (channel: number) => {
    const sRgbNormalized = channel / 255;
    return sRgbNormalized <= 0.03928
      ? sRgbNormalized / 12.92
      : Math.pow((sRgbNormalized + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

/**
 * WCAG 2.1 contrast ratio between two relative luminance values.
 * The ratio ranges from 1:1 (identical) to 21:1 (black on white).
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function wcagContrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Candidate ink colors for checkmarks / icons on a solid swatch, with their
 * luminance values pre-computed once at module load so checkmarkColorOnHexSwatch
 * does not re-parse the same hex strings on every render.
 *
 * To add more ink options (e.g. a mid-tone), push an entry here.
 */
const INK_CANDIDATES = [
  {
    color: colors.textPrimary,
    luminance: relativeLuminanceFromRgb(
      parseHexRgb(colors.textPrimary) ?? { r: 0, g: 0, b: 0 },
    ),
  },
  {
    color: colors.textLight,
    luminance: relativeLuminanceFromRgb(
      parseHexRgb(colors.textLight) ?? { r: 255, g: 255, b: 255 },
    ),
  },
] as const;

/**
 * Returns the ink color (checkmark / icon) with the highest WCAG contrast
 * ratio against the given swatch background.
 *
 * This replaces a fixed luminance threshold, which mispicked ink for mid-tone
 * palette entries such as #CA8A04 where the threshold produced a ~2.94:1 ratio
 * while the other candidate achieves ~3.93:1.
 *
 * Falls back to `colors.textLight` for any unparseable hex value.
 *
 * @param hexColor - A 6-digit hex color string (e.g. `#FFFFFF`)
 */
export function checkmarkColorOnHexSwatch(hexColor: string): string {
  const rgb = parseHexRgb(hexColor);
  if (!rgb) {
    return colors.textLight;
  }
  const swatchLuminance = relativeLuminanceFromRgb(rgb);
  const bestInk = INK_CANDIDATES.reduce((best, candidate) => {
    const candidateContrast = wcagContrastRatio(swatchLuminance, candidate.luminance);
    const bestContrast = wcagContrastRatio(swatchLuminance, best.luminance);
    return candidateContrast > bestContrast ? candidate : best;
  });
  return bestInk.color;
}
