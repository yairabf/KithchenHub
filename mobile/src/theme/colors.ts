export const colors = {
  // Primary colors - Vibrant Teal palette from Stitch
  primary: '#14B8A6',        // Vibrant Teal - main brand color
  primaryLight: '#E6FFFA',   // Very light teal accent
  primaryDark: '#0D9488',    // Darker teal for pressed states
  secondary: '#F59E0B',      // Amber - highlights/accents

  // Background colors
  background: '#F8FAFC',     // Light slate - main app background
  surface: '#FFFFFF',        // White - cards, modals
  surfaceGlass: 'rgba(255, 255, 255, 0.8)', // Glassmorphism surfaces

  // Section accent colors
  shopping: '#14B8A6',       // Teal
  recipes: '#3B82F6',        // Blue
  chores: '#F59E0B',         // Amber

  // Text colors
  textPrimary: '#1E293B',    // Dark slate - main text
  textSecondary: '#64748B',  // Slate-500 - subtitles, hints
  textMuted: '#94A3B8',      // Slate-400 - muted text
  textLight: '#FFFFFF',      // Text on dark backgrounds

  // State colors
  success: '#10B981',        // Emerald-500
  warning: '#F59E0B',        // Amber-500
  error: '#EF4444',          // Red-500

  // Border & divider
  border: '#E2E8F0',         // Slate-200 border
  borderDashed: '#CBD5E1',   // Slate-300 for dashed borders
  divider: '#F1F5F9',        // Slate-100

  // UI elements
  backdrop: 'rgba(15, 23, 42, 0.4)', // Slate-900/40 for modals
  widgetBackground: '#F1F5F9',       // Slate-100 for widgets
  buttonInactive: '#CBD5E1',         // Slate-300
  quantityBg: '#F8FAFC',             // Slate-50 - quantity controls
  addButton: '#14B8A6',              // Teal - add button

  // Google button
  google: '#4285F4',

  // Avatar fallback
  avatarBackground: '#F5F5F0',       // Warm cream

  // Icon background colors (Stitch style)
  iconBg: {
    teal: '#F0FDFA',
    orange: '#FFF7ED',
    blue: '#EFF6FF',
    purple: '#FAF5FF',
    amber: '#FFFBEB',
  },

  // Pastel palette for cards/decorative elements (Slate/Teal compatible)
  pastel: {
    cyan: '#F1F5F9',       // Slate-100
    green: '#DCFCE7',      // Green-100
    peach: '#FFEDD5',      // Orange-100
    coral: '#FEE2E2',      // Red-100
    lavender: '#F3E8FF',   // Purple-100
    yellow: '#FEF9C3',     // Yellow-100
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
