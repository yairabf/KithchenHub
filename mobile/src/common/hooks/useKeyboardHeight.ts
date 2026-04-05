import { useState, useEffect, useRef } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

/**
 * Returns the effective keyboard height that should be subtracted from
 * `useWindowDimensions().height` to compute the visible area above the
 * soft keyboard.
 *
 * ### Why not just use the keyboard event height?
 *
 * On Android the system can resize the window when the keyboard opens
 * (`softwareKeyboardLayoutMode: 'resize'`, Expo's default).  In that mode
 * `useWindowDimensions().height` **already** reflects the shrunk visible
 * area, so subtracting the keyboard event height on top would double-count
 * it and collapse any keyboard-aware UI to the minimum height.
 *
 * This hook compares the keyboard event height against how much the window
 * has **actually** shrunk and returns only the remaining offset that has not
 * yet been absorbed by window resizing:
 *
 * ```
 * effectiveOffset = max(keyboardEventHeight − windowShrinkage, 0)
 * ```
 *
 * Platform behaviour:
 * - **iOS** (`adjustPan`): window never resizes → shrinkage = 0 → returns
 *   the full keyboard event height.
 * - **Android adjustResize**: window shrinks by ≈ keyboard height →
 *   shrinkage ≈ keyboardEventHeight → returns 0 (window height is already
 *   the visible area; no further subtraction needed).
 * - **Android adjustPan**: window never resizes → returns the full keyboard
 *   event height, same as iOS.
 *
 * @returns Effective keyboard offset in points (0 when keyboard is hidden).
 */
export function useKeyboardHeight(): number {
  const { height: windowHeight } = useWindowDimensions();
  const stableHeightRef = useRef(windowHeight);
  const [keyboardEventHeight, setKeyboardEventHeight] = useState(0);

  // Keep stable height up-to-date whenever the keyboard is not open.
  // This handles orientation changes and other non-keyboard dimension shifts.
  useEffect(() => {
    if (keyboardEventHeight === 0) {
      stableHeightRef.current = windowHeight;
    }
  }, [windowHeight, keyboardEventHeight]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardEventHeight(e.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardEventHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // On Android adjustResize the window shrinks by the keyboard height, so
  // (stableHeight − windowHeight) ≈ keyboardEventHeight and the result is ~0.
  // On iOS / adjustPan windowShrinkage is 0, returning the full event height.
  const windowShrinkage = stableHeightRef.current - windowHeight;
  return Math.max(keyboardEventHeight - windowShrinkage, 0);
}
