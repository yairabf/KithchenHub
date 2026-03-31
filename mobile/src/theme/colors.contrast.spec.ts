import {
  checkmarkColorOnHexSwatch,
  parseHexRgb,
  relativeLuminanceFromRgb,
  wcagContrastRatio,
  colors,
} from './index';

// ---------------------------------------------------------------------------
// parseHexRgb
// ---------------------------------------------------------------------------
describe.each([
  ['lowercase 6-digit hex', '#dc2626', { r: 220, g: 38, b: 38 }],
  ['uppercase 6-digit hex', '#DC2626', { r: 220, g: 38, b: 38 }],
  ['pure white', '#FFFFFF', { r: 255, g: 255, b: 255 }],
  ['pure black', '#000000', { r: 0, g: 0, b: 0 }],
])('parseHexRgb with valid input %s', (_label, hex, expected) => {
  it(`parses ${hex} correctly`, () => {
    expect(parseHexRgb(hex)).toEqual(expected);
  });
});

describe.each([
  ['3-char shorthand', '#FFF'],
  ['rgba string', 'rgba(255,255,255,1)'],
  ['plain text', 'not-a-color'],
  ['empty string', ''],
  ['7 chars', '#FFFFFFF'],
])('parseHexRgb with invalid input', (_label, hex) => {
  it(`returns null for "${hex}"`, () => {
    expect(parseHexRgb(hex)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// relativeLuminanceFromRgb
// ---------------------------------------------------------------------------
describe('relativeLuminanceFromRgb', () => {
  it('returns 1 for pure white', () => {
    expect(relativeLuminanceFromRgb({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it('returns 0 for pure black', () => {
    expect(relativeLuminanceFromRgb({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
  });

  it('returns a value between 0 and 1 for mid-gray', () => {
    const luminance = relativeLuminanceFromRgb({ r: 128, g: 128, b: 128 });
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// wcagContrastRatio
// ---------------------------------------------------------------------------
describe.each([
  ['black on white is 21:1', 0, 1, 21],
  ['identical luminances is 1:1', 0.5, 0.5, 1],
  ['symmetric — argument order does not matter', 0.2, 0.8, (0.8 + 0.05) / (0.2 + 0.05)],
])('wcagContrastRatio', (_label, a, b, expected) => {
  it(_label, () => {
    expect(wcagContrastRatio(a, b)).toBeCloseTo(expected, 5);
  });
});

// ---------------------------------------------------------------------------
// checkmarkColorOnHexSwatch — picks the ink with the highest contrast ratio
// ---------------------------------------------------------------------------
describe.each([
  // --- dark swatches: light ink wins ---
  ['dark navy uses light checkmark', '#1B3C53', colors.textLight],
  ['shopping blue uses light checkmark', '#234C6A', colors.textLight],
  // --- mid-range: grey where light ink still has higher contrast (~3.95:1) ---
  ['mid-gray (#888) uses light checkmark', '#888888', colors.textLight],
  // --- amber: previously mispicked by luminance threshold; dark ink wins (3.93:1 vs 2.94:1) ---
  ['amber (#CA8A04) uses dark checkmark', '#CA8A04', colors.textPrimary],
  // --- light swatches: dark ink wins ---
  ['light gray uses dark checkmark', '#E5E7EB', colors.textPrimary],
  ['pure white uses dark checkmark', '#FFFFFF', colors.textPrimary],
  ['uppercase hex parses correctly', '#FFFFFF', colors.textPrimary],
  // --- parse failures fall back to light ---
  ['3-char hex falls back to light', '#FFF', colors.textLight],
  ['invalid hex falls back to light', 'not-a-color', colors.textLight],
])('checkmarkColorOnHexSwatch', (_label, hex, expected) => {
  it(_label, () => {
    expect(checkmarkColorOnHexSwatch(hex)).toBe(expected);
  });
});
