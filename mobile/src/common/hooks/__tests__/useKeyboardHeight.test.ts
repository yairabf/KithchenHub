import { renderHook, act } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';

// We need to control what useWindowDimensions returns
let mockWindowHeight = 844;
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    useWindowDimensions: jest.fn(() => ({ width: 390, height: mockWindowHeight })),
  };
});

import { useKeyboardHeight } from '../useKeyboardHeight';

describe('useKeyboardHeight', () => {
  const listeners: Record<string, (e?: any) => void> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowHeight = 844;
    Object.keys(listeners).forEach((k) => delete listeners[k]);

    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, callback) => {
      listeners[event] = callback;
      return { remove: jest.fn() } as any;
    });
  });

  // ---------------------------------------------------------------------------
  // Event subscription wiring
  // ---------------------------------------------------------------------------

  it.each([
    ['ios', 'keyboardWillShow', 'keyboardWillHide'],
    ['android', 'keyboardDidShow', 'keyboardDidHide'],
  ])(
    'on %s should subscribe to %s / %s',
    (os, showEvent, hideEvent) => {
      (Platform as any).OS = os;
      renderHook(() => useKeyboardHeight());

      expect(listeners[showEvent]).toBeDefined();
      expect(listeners[hideEvent]).toBeDefined();
    },
  );

  it('should return 0 initially', () => {
    (Platform as any).OS = 'ios';
    const { result } = renderHook(() => useKeyboardHeight());
    expect(result.current).toBe(0);
  });

  it('should clean up listeners on unmount', () => {
    (Platform as any).OS = 'ios';
    const removeSpy = jest.fn();
    (Keyboard.addListener as jest.Mock).mockReturnValue({ remove: removeSpy });

    const { unmount } = renderHook(() => useKeyboardHeight());
    unmount();

    expect(removeSpy).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // iOS / adjustPan: window never resizes → return full event height
  // ---------------------------------------------------------------------------

  describe('iOS (adjustPan – window does not resize)', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('returns the full keyboard event height when window is stable', () => {
      const { result } = renderHook(() => useKeyboardHeight());

      act(() => {
        // window stays at 844 (iOS never resizes)
        listeners['keyboardWillShow']({ endCoordinates: { height: 320 } });
      });

      expect(result.current).toBe(320);
    });

    it('resets to 0 when keyboard hides', () => {
      const { result } = renderHook(() => useKeyboardHeight());

      act(() => {
        listeners['keyboardWillShow']({ endCoordinates: { height: 320 } });
      });
      act(() => {
        listeners['keyboardWillHide']();
      });

      expect(result.current).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Android adjustResize: window already shrank → return 0 (no double-subtract)
  // ---------------------------------------------------------------------------

  describe('Android adjustResize (window already shrinks to visible area)', () => {
    beforeEach(() => {
      (Platform as any).OS = 'android';
    });

    it('returns 0 when window has already shrunk by exactly the keyboard height', () => {
      const { result, rerender } = renderHook(() => useKeyboardHeight());

      // Keyboard opens: system resizes window 844 → 524 (320 absorbed)
      act(() => {
        mockWindowHeight = 524; // window already shrank
        listeners['keyboardDidShow']({ endCoordinates: { height: 320 } });
      });
      rerender({});

      // windowShrinkage = 844 - 524 = 320 = keyboardEventHeight → effective = 0
      expect(result.current).toBe(0);
    });

    it('returns 0 when window shrinks by more than the keyboard event (rounding)', () => {
      const { result, rerender } = renderHook(() => useKeyboardHeight());

      act(() => {
        mockWindowHeight = 520; // shrunk by 324, event says 320
        listeners['keyboardDidShow']({ endCoordinates: { height: 320 } });
      });
      rerender({});

      expect(result.current).toBe(0); // clamped to 0, never negative
    });

    it('returns the unabsorbed portion when window only partially shrinks', () => {
      const { result, rerender } = renderHook(() => useKeyboardHeight());

      // Window shrank by only 200px but keyboard is 320px tall
      // (e.g. adjustPan-like partial overlap scenario)
      act(() => {
        mockWindowHeight = 644; // 844 - 200
        listeners['keyboardDidShow']({ endCoordinates: { height: 320 } });
      });
      rerender({});

      // windowShrinkage = 200, keyboardEvent = 320 → effective = 120
      expect(result.current).toBe(120);
    });
  });

  // ---------------------------------------------------------------------------
  // Android adjustPan: window never resizes → same as iOS, full event height
  // ---------------------------------------------------------------------------

  describe('Android adjustPan (window does not resize)', () => {
    beforeEach(() => {
      (Platform as any).OS = 'android';
    });

    it('returns the full keyboard event height when window stays stable', () => {
      const { result, rerender } = renderHook(() => useKeyboardHeight());

      act(() => {
        // Window stays at 844 (adjustPan mode – no resize)
        listeners['keyboardDidShow']({ endCoordinates: { height: 300 } });
      });
      rerender({});

      expect(result.current).toBe(300);
    });
  });

  // ---------------------------------------------------------------------------
  // Stable height refresh after keyboard hides
  // ---------------------------------------------------------------------------

  it('updates the stable height baseline after keyboard dismisses (e.g. orientation change)', () => {
    (Platform as any).OS = 'ios';
    const { result, rerender } = renderHook(() => useKeyboardHeight());

    // First keyboard open/close cycle
    act(() => {
      listeners['keyboardWillShow']({ endCoordinates: { height: 320 } });
    });
    act(() => {
      listeners['keyboardWillHide']();
    });

    // Simulate orientation change: window becomes taller
    act(() => {
      mockWindowHeight = 926;
    });
    rerender({});

    // Second keyboard open: stable height is now 926, window stays 926 (iOS), event = 300
    act(() => {
      listeners['keyboardWillShow']({ endCoordinates: { height: 300 } });
    });

    expect(result.current).toBe(300);
  });
});
