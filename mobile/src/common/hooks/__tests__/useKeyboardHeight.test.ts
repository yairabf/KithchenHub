import { renderHook, act } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';
import { useKeyboardHeight } from '../useKeyboardHeight';

describe('useKeyboardHeight', () => {
  const listeners: Record<string, (e?: any) => void> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(listeners).forEach((k) => delete listeners[k]);

    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, callback) => {
      listeners[event] = callback;
      return { remove: jest.fn() } as any;
    });
  });

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

  it('should update when keyboard shows and reset when hidden', () => {
    (Platform as any).OS = 'ios';
    const { result } = renderHook(() => useKeyboardHeight());

    act(() => {
      listeners['keyboardWillShow']({ endCoordinates: { height: 320 } });
    });
    expect(result.current).toBe(320);

    act(() => {
      listeners['keyboardWillHide']();
    });
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
});
