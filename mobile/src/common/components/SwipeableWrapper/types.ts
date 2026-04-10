import type { ReactNode } from 'react';

/**
 * Props for SwipeableWrapper component
 * Generic swipe-to-delete wrapper that can wrap any content
 */
export interface SwipeableWrapperProps {
  /** Content to render inside the swipeable container */
  children: ReactNode;

  /**
   * Callback invoked when the user taps the revealed delete action.
   */
  onSwipeDelete: () => void;

  /**
   * Distance in px the card can be swiped to reveal actions.
   * @default 84
   */
  actionWidth?: number;

  /**
   * If true, disables swipe gestures entirely.
   * Useful for conditionally disabling swipe-to-delete in certain contexts.
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional border radius for the delete backgrounds.
   * Should match the border radius of the child content to ensure the red delete
   * backgrounds align perfectly with the visible card edges during swipe gestures.
   *
   * @example
   * // For content with borderRadius.xxl (24px):
   * <SwipeableWrapper borderRadius={borderRadius.xxl}>
   *   <ListItemCardWrapper>...</ListItemCardWrapper>
   * </SwipeableWrapper>
   *
   * @default borderRadius.lg (12)
   */
  borderRadius?: number;
}
