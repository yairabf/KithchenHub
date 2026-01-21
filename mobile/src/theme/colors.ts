export const colors = {
  // Primary colors - Earthy/Natural palette
  primary: '#606c38',        // Olive green - main brand color
  primaryLight: '#dda15e',   // Golden/honey - lighter accents
  primaryDark: '#283618',    // Dark forest green - pressed/active states
  secondary: '#bc6c25',      // Warm brown - accents, links

  // Background colors
  background: '#F5F5F0',     // Warm cream - main app background
  surface: '#FFFFFF',        // White - cards, modals
  surfaceGlass: 'rgba(255, 255, 255, 0.4)', // Glassmorphism surfaces

  // Section accent colors
  shopping: '#606c38',       // Olive green
  recipes: '#bc6c25',        // Warm brown
  chores: '#283618',         // Dark forest green

  // Text colors
  textPrimary: '#2D3139',    // Warmer dark - main text
  textSecondary: '#6B7280',  // Gray-500 - subtitles, hints
  textMuted: '#9CA3AF',      // Gray-400 - muted text
  textLight: '#FFFFFF',      // Text on dark backgrounds

  // State colors
  success: '#606c38',        // Olive green
  warning: '#F59E0B',        // Amber-500
  error: '#EF4444',          // Red-500

  // Border & divider
  border: '#E5E7EB',         // Gray-200 border
  borderDashed: '#CBD5E1',   // Slate-300 for dashed borders
  divider: '#F0F0F0',

  // UI elements
  backdrop: 'rgba(30, 41, 59, 0.4)', // Slate-800/40 for modals
  widgetBackground: '#D1D5DB',       // Gray-300 for widgets
  buttonInactive: '#9CA3AF',         // Gray-400
  quantityBg: '#F3F4F6',             // Gray-100 - quantity controls
  addButton: '#dda15e',              // Golden/honey - add button

  // Google button
  google: '#4285F4',

  // Avatar fallback
  avatarBackground: '#F5F5F0',       // Warm cream

  // Pastel palette for cards/decorative elements (earth tones)
  pastel: {
    cyan: '#E8E4D9',       // Warm gray
    green: '#D4DBC4',      // Sage
    peach: '#F5E6C8',      // Soft wheat
    coral: '#E8D4B8',      // Tan
    lavender: '#D6CFC4',   // Taupe
    yellow: '#F0E5D0',     // Light cream
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
