export const colors = {
  // Primary colors - FullHouse blue palette
  primary: '#234C6A',
  primaryLight: '#456882',
  primaryDark: '#1B3C53',
  secondary: '#456882',

  // Background colors
  background: '#E3E3E3',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.8)', // Glassmorphism surfaces

  // Section accent colors
  shopping: '#234C6A',
  recipes: '#456882',
  chores: '#1B3C53',

  // Text colors
  textPrimary: '#1B3C53',
  textSecondary: '#456882',
  textMuted: '#6D8597',
  textLight: '#FFFFFF',      // Text on dark backgrounds

  // State colors
  success: '#10B981',        // Emerald-500
  warning: '#456882',
  error: '#EF4444',          // Red-500

  // Border & divider
  border: '#C8D0D7',
  borderDashed: '#AFBDC8',
  divider: '#D5DBE0',

  // UI elements
  backdrop: 'rgba(27, 60, 83, 0.4)',
  widgetBackground: '#DCE1E5',
  buttonInactive: '#AFBDC8',
  quantityBg: '#E9ECEF',
  addButton: '#234C6A',

  // Google button
  google: '#4285F4',

  // Avatar fallback
  avatarBackground: '#E3E3E3',

  // Icon background colors (Stitch style)
  iconBg: {
    teal: '#D9E1E8',
    orange: '#E3E3E3',
    blue: '#D2DCE4',
    purple: '#DCE3E8',
    amber: '#E8EBEE',
  },

  // Soft palette for cards/decorative elements
  pastel: {
    cyan: '#D8E0E7',
    green: '#D4DEE6',
    peach: '#E3E3E3',
    coral: '#D9DDE1',
    lavender: '#D1D9E0',
    yellow: '#DEE3E7',
  },

  // Transparent variants
  transparent: {
    white50: 'rgba(255, 255, 255, 0.5)',
    white60: 'rgba(255, 255, 255, 0.6)',
    white70: 'rgba(255, 255, 255, 0.7)',
    white80: 'rgba(255, 255, 255, 0.8)',
    black10: 'rgba(0, 0, 0, 0.1)',
  },
};

// Helper function to add opacity to a hex color
export function withOpacity(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Pastel colors as array for indexed access (e.g., card backgrounds)
export const pastelColors = [
  colors.pastel.cyan,
  colors.pastel.green,
  colors.pastel.peach,
  colors.pastel.coral,
  colors.pastel.lavender,
  colors.pastel.yellow,
];

export type ColorKey = keyof typeof colors;
