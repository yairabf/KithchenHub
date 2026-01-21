import type { ReactNode } from 'react';

/**
 * Props for SwipeableWrapper component
 * Generic swipe-to-delete wrapper that can wrap any content
 */
export interface SwipeableWrapperProps {
  /** Content to render inside the swipeable container */
  children: ReactNode;

  /**
   * Callback invoked when item is swiped past the deletion threshold (30% of screen width)
   * or when swipe velocity exceeds 1000.
   * @note Renamed from `onDelete` in SwipeableShoppingItem for clarity
   */
  onSwipeDelete: () => void;

  /**
   * If true, disables swipe gestures entirely.
   * Useful for conditionally disabling swipe-to-delete in certain contexts.
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional background color for the swipeable card.
   * @default colors.surface (white)
   */
  backgroundColor?: string;

  /**
   * Optional border radius for the swipeable card and delete backgrounds.
   * Should match the border radius of the child content to ensure the red delete
   * backgrounds align perfectly with the visible card edges during swipe gestures.
   *
   * @example
   * // For GroceryCard with borderRadius.xxl (24px):
   * <SwipeableWrapper borderRadius={borderRadius.xxl}>
   *   <GroceryCard>...</GroceryCard>
   * </SwipeableWrapper>
   *
   * @example
   * // For ChoresScreen with default borderRadius.lg (12px):
   * <SwipeableWrapper>
   *   <ChoreCard>...</ChoreCard>
   * </SwipeableWrapper>
   *
   * @default borderRadius.lg (12)
   */
  borderRadius?: number;
}
