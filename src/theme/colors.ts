export const colors = {
  // Primary colors - Indigo palette
  primary: '#6366F1',        // Indigo-500 - main brand color
  primaryLight: '#818CF8',   // Indigo-400 - lighter accents
  primaryDark: '#4F46E5',    // Indigo-600 - pressed/active states
  secondary: '#2EC4B6',      // Teal - accents, links

  // Background colors
  background: '#F5F5F0',     // Warm cream - main app background
  surface: '#FFFFFF',        // White - cards, modals
  surfaceGlass: 'rgba(255, 255, 255, 0.4)', // Glassmorphism surfaces

  // Section accent colors
  shopping: '#10B981',       // Emerald-500 (green)
  recipes: '#F97316',        // Orange-500
  chores: '#4A5D4A',         // Neutral green-gray

  // Text colors
  textPrimary: '#2D3139',    // Warmer dark - main text
  textSecondary: '#6B7280',  // Gray-500 - subtitles, hints
  textMuted: '#9CA3AF',      // Gray-400 - muted text
  textLight: '#FFFFFF',      // Text on dark backgrounds

  // State colors
  success: '#10B981',        // Emerald-500
  warning: '#F59E0B',        // Amber-500
  error: '#EF4444',          // Red-500

  // Border & divider
  border: '#E5E7EB',         // Gray-200 border
  divider: '#F0F0F0',

  // UI elements
  backdrop: 'rgba(30, 41, 59, 0.4)', // Slate-800/40 for modals
  widgetBackground: '#D1D5DB',       // Gray-300 for widgets
  buttonInactive: '#9CA3AF',         // Gray-400
  quantityBg: '#F3F4F6',             // Gray-100 - quantity controls
  addButton: '#F5DEB3',              // Wheat/tan - add button

  // Google button
  google: '#4285F4',
};

export type ColorKey = keyof typeof colors;
