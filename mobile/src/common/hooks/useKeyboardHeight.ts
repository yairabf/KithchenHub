import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tracks the current software keyboard height.
 *
 * On iOS uses `keyboardWillShow` / `keyboardWillHide` for smoother
 * transitions. On Android falls back to `keyboardDidShow` / `keyboardDidHide`.
 *
 * @returns The keyboard height in points (0 when hidden).
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
}
