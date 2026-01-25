import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AppLifecycleProvider, useAppLifecycle } from '../AppLifecycleContext';

const listeners: Array<(state: string) => void> = [];

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    AppState: {
      currentState: 'active',
      addEventListener: (_type: string, handler: (state: string) => void) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      },
    },
  };
});

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
