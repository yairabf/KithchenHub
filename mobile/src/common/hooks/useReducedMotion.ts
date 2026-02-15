import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to detect if user prefers reduced motion.
 *
 * Returns true if user has enabled "Reduce Motion" in system accessibility settings.
 * Use this to conditionally disable or simplify animations for users with motion sensitivity.
 *
 * @example
 * ```typescript
 * const reduceMotion = useReducedMotion();
 *
 * if (!reduceMotion) {
 *   Animated.timing(animatedValue, { ... }).start();
 * } else {
 *   // Skip animation or use instant transition
 *   animatedValue.setValue(targetValue);
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {
        // If API fails, default to false (animations enabled)
        setReduceMotion(false);
      });

    // Listen for changes (user toggles setting while app is running)
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
