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
  MIN_HEIGHT: 500,
  HEIGHT_RATIO: 0.5,
} as const;
