import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

const listeners: Array<(state: string) => void> = [];

// Mock AppState specifically - avoid spreading entire react-native to prevent native module loading issues
jest.mock('react-native', () => {
  // Only require what we absolutely need, avoid full module load
  const mockAppState = {
    currentState: 'active' as const,
    addEventListener: jest.fn((_type: string, handler: (state: string) => void) => {
      listeners.push(handler);
      return { remove: jest.fn() };
    }),
  };

  // Return minimal mock that only includes AppState
  // This avoids loading native modules that don't exist in test environment
  return {
    AppState: mockAppState,
    Platform: {
      OS: 'ios',
      select: jest.fn((obj: any) => obj.ios || obj.default),
    },
  };
});

import { AppLifecycleProvider, useAppLifecycle } from '../AppLifecycleContext';

describe('AppLifecycleContext', () => {
  beforeEach(() => {
    listeners.length = 0;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppLifecycleProvider>{children}</AppLifecycleProvider>
  );

  describe.each([['active', true, false]])(
    'initial state: %s',
    (_label, expectedActive, expectedBackground) => {
      it('provides initial state values', () => {
        const { result } = renderHook(() => useAppLifecycle(), { wrapper });

        expect(result.current.isActive).toBe(expectedActive);
        expect(result.current.isBackground).toBe(expectedBackground);
      });
    }
  );

  describe.each([
    ['background', true, false],
    ['inactive', true, false],
  ])('transition to %s', (nextState, expectedBackground, expectedForeground) => {
    it('updates background and foreground flags', () => {
      const { result } = renderHook(() => useAppLifecycle(), { wrapper });

      act(() => listeners.forEach(l => l(nextState)));
      expect(result.current.isBackground).toBe(expectedBackground);
      expect(result.current.isForeground).toBe(expectedForeground);

      act(() => listeners.forEach(l => l('active')));
      expect(result.current.isForeground).toBe(true);
      expect(result.current.previousState).toBe(nextState);
    });
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useAppLifecycle())).toThrow(
      'useAppLifecycle must be used within an AppLifecycleProvider'
    );
  });
});
