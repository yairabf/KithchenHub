/**
 * useClickOutside Hook
 * 
 * React hook that detects clicks outside a specified container element.
 * Only works on web platform (React Native Web).
 * 
 * @example
 * ```typescript
 * const containerRef = useRef<View>(null);
 * 
 * useClickOutside({
 *   enabled: showDropdown,
 *   onOutsideClick: () => setShowDropdown(false),
 *   containerRef,
 *   testId: 'my-container',
 * });
 * ```
 */

import { useEffect, RefObject } from 'react';
import { Platform } from 'react-native';

export interface UseClickOutsideOptions {
  /**
   * Whether the click-outside detection is enabled
   */
  enabled: boolean;
  /**
   * Callback function called when a click outside is detected
   */
  onOutsideClick: () => void;
  /**
   * Ref to the container element to check clicks against
   */
  containerRef: RefObject<HTMLElement | null>;
  /**
   * Optional testID to find container element via querySelector
   * Used as fallback if containerRef.current is null
   */
  testId?: string;
  /**
   * Optional ref to a dropdown element (for nested containers)
   * If provided, clicks inside this element are also considered "inside"
   */
  dropdownRef?: RefObject<HTMLElement | null>;
  /**
   * Optional testID for dropdown element
   */
  dropdownTestId?: string;
}

/**
 * Helper function to check if a click event occurred inside a given element.
 * Checks both direct containment and closest ancestor matching the testID.
 * 
 * @param element - The element to check against (can be null)
 * @param target - The click target element
 * @param testId - Optional testID to match via querySelector
 * @returns true if click is inside the element, false otherwise
 */
function isClickInsideElement(
  element: HTMLElement | null,
  target: HTMLElement,
  testId?: string
): boolean {
  if (!element) return false;
  
  const isDirectlyInside = element.contains(target);
  const isInAncestor = testId && target.closest 
    ? target.closest(`[data-testid="${testId}"]`) !== null
    : false;
  
  return isDirectlyInside || isInAncestor;
}

/**
 * Hook that detects clicks outside a container element and calls a callback.
 * Only attaches event listeners on web platform.
 * 
 * @param options - Configuration options for click-outside detection
 */
export function useClickOutside({
  enabled,
  onOutsideClick,
  containerRef,
  testId,
  dropdownRef,
  dropdownTestId,
}: UseClickOutsideOptions): void {
  useEffect(() => {
    // Only work on web platform
    if (!enabled || Platform.OS !== 'web') return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      try {
        const target = event.target as HTMLElement;
        if (!target) return;

        // Find container element - prefer ref, fallback to testID
        let containerElement: HTMLElement | null = containerRef.current;
        if (!containerElement && testId) {
          containerElement = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
        }

        // Find dropdown element if provided
        let dropdownElement: HTMLElement | null = null;
        if (dropdownRef?.current) {
          dropdownElement = dropdownRef.current;
        } else if (dropdownTestId) {
          dropdownElement = document.querySelector(`[data-testid="${dropdownTestId}"]`) as HTMLElement | null;
        }

        // If elements not found, safe to call callback (click is outside)
        if (!containerElement && !dropdownElement) {
          onOutsideClick();
          return;
        }

        // Check if click is inside container or dropdown using helper
        const clickedInsideContainer = isClickInsideElement(containerElement, target, testId);
        const clickedInsideDropdown = isClickInsideElement(dropdownElement, target, dropdownTestId);

        // Only call callback if clicking outside both container and dropdown
        if (!clickedInsideContainer && !clickedInsideDropdown) {
          onOutsideClick();
        }
      } catch (error) {
        // Fallback: call callback on any error to prevent stuck state
        console.error('Error in click-outside handler:', error);
        onOutsideClick();
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [enabled, onOutsideClick, containerRef, testId, dropdownRef, dropdownTestId]);
}
