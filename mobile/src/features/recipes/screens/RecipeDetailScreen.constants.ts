/**
 * Constants for RecipeDetailScreen sticky header animations and calculations
 */

export const STICKY_HEADER_ANIMATION = {
  FADE_IN_DURATION: 150,
  FADE_OUT_DURATION: 100,
  SLIDE_OUT_OFFSET: -5,
  INITIAL_TRANSLATE_Y: -10,
  SCROLL_THRESHOLD_OFFSET: 1,
  SPRING_TENSION: 100,
  SPRING_FRICTION: 8,
} as const;

export const SCROLL_CONFIG = {
  EVENT_THROTTLE: 16,
} as const;

export const SCROLL_VIEW_CONFIG = {
  // Safety floor for split view to prevent collapse on small screens
  MIN_HEIGHT: 400,
  HEIGHT_RATIO: 0.85,
} as const;

/**
 * Bottom padding for scroll content to ensure all content is accessible
 * Accounts for safe area insets, potential tab bars, and provides extra spacing
 * for comfortable scrolling experience
 */
export const SCROLL_CONTENT_BOTTOM_PADDING = 180;
