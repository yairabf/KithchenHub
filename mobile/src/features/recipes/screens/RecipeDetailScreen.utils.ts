/**
 * Utility functions for RecipeDetailScreen sticky header calculations
 * 
 * These pure functions handle calculations for sticky header positioning,
 * scroll detection, and layout spacing. They are extracted for reusability
 * and testability.
 */

import { STICKY_HEADER_ANIMATION } from './RecipeDetailScreen.constants';

/**
 * Calculates the sticky header top position accounting for safe area insets
 * @param headerHeight - Height of the screen header
 * @param safeAreaTop - Top inset from safe area
 * @returns Top position for sticky header, or 0 if header height is invalid
 */
export function calculateStickyHeaderTopPosition(
  headerHeight: number,
  safeAreaTop: number
): number {
  if (headerHeight <= 0) return 0;
  const topInset = Math.max(0, safeAreaTop); // Ensure non-negative
  return topInset + headerHeight;
}

/**
 * Determines if the recipe header has been scrolled past
 * @param currentScrollY - Current scroll position
 * @param headerHeightValue - Height of the recipe header
 * @returns True if header has been scrolled past the threshold
 */
export function calculateIsHeaderScrolled(
  currentScrollY: number,
  headerHeightValue: number
): boolean {
  const threshold = headerHeightValue > 0 
    ? headerHeightValue - STICKY_HEADER_ANIMATION.SCROLL_THRESHOLD_OFFSET 
    : 0;
  return currentScrollY >= threshold && threshold > 0;
}

/**
 * Calculates the spacer height to prevent layout shift when sticky header appears
 * @param headerScrolled - Whether the header has been scrolled past
 * @param contentHeaderHeightValue - Height of the content header
 * @returns Height for spacer, or 0 if header is not scrolled
 */
export function calculateSpacerHeight(
  headerScrolled: boolean,
  contentHeaderHeightValue: number
): number {
  return headerScrolled && contentHeaderHeightValue > 0 ? contentHeaderHeightValue : 0;
}

/**
 * Determines if the sticky header should be visible
 * @param headerScrolled - Whether the recipe header has been scrolled past
 * @param contentHeaderHeightValue - Height of the content header
 * @param screenHeaderHeightValue - Height of the screen header
 * @returns True if sticky header should be shown
 */
export function calculateShouldShowStickyHeader(
  headerScrolled: boolean,
  contentHeaderHeightValue: number,
  screenHeaderHeightValue: number
): boolean {
  return headerScrolled && contentHeaderHeightValue > 0 && screenHeaderHeightValue > 0;
}
