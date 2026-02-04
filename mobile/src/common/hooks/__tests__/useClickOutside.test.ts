/**
 * Tests for useClickOutside hook
 * 
 * Tests click-outside detection functionality for web platform.
 * Uses parameterized tests to cover multiple scenarios.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useRef } from 'react';
import { useClickOutside } from '../useClickOutside';

// Mock Platform.OS
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

describe('useClickOutside', () => {
  beforeEach(() => {
    // Reset Platform.OS to web before each test
    (Platform as any).OS = 'web';
    
    // Clear all event listeners
    document.removeEventListener('mousedown', jest.fn(), true);
    document.removeEventListener('touchstart', jest.fn(), true);
  });

  describe.each([
    ['when enabled is true', true],
    ['when enabled is false', false],
  ])('%s', (description, enabled) => {
    it('should attach event listeners when enabled', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const onOutsideClick = jest.fn();
      const containerRef = useRef<HTMLElement | null>(null);

      renderHook(() => useClickOutside({ enabled, onOutsideClick, containerRef }));

      if (enabled) {
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
        expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), true);
      } else {
        expect(addEventListenerSpy).not.toHaveBeenCalled();
      }

      addEventListenerSpy.mockRestore();
    });
  });

  describe('click detection', () => {
    let containerElement: HTMLElement;
    let onOutsideClick: jest.Mock;

    beforeEach(() => {
      containerElement = document.createElement('div');
      containerElement.setAttribute('data-testid', 'test-container');
      document.body.appendChild(containerElement);
      onOutsideClick = jest.fn();
    });

    afterEach(() => {
      document.body.removeChild(containerElement);
      onOutsideClick.mockClear();
    });

    describe.each([
      ['clicking inside container', true, false],
      ['clicking outside container', false, true],
      ['clicking on container element itself', true, false],
    ])('%s', (description, clickInside, shouldCallCallback) => {
      it(`should ${shouldCallCallback ? 'call' : 'not call'} onOutsideClick`, () => {
        const containerRef = useRef<HTMLElement | null>(containerElement);
        renderHook(() =>
          useClickOutside({
            enabled: true,
            onOutsideClick,
            containerRef,
            testId: 'test-container',
          })
        );

        const target = clickInside ? containerElement : document.body;
        const event = new MouseEvent('mousedown', { bubbles: true });

        act(() => {
          target.dispatchEvent(event);
        });

        if (shouldCallCallback) {
          expect(onOutsideClick).toHaveBeenCalledTimes(1);
        } else {
          expect(onOutsideClick).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully and call callback', () => {
      const onOutsideClick = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a ref that will cause an error
      const invalidRef = useRef<HTMLElement | null>(null);

      renderHook(() =>
        useClickOutside({
          enabled: true,
          onOutsideClick,
          containerRef: invalidRef,
          testId: 'non-existent',
        })
      );

      const event = new MouseEvent('mousedown', { bubbles: true });
      act(() => {
        document.body.dispatchEvent(event);
      });

      // Should still call callback even if there's an error
      expect(onOutsideClick).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const onOutsideClick = jest.fn();

      const containerRef = useRef<HTMLElement | null>(null);
      const { unmount } = renderHook(() =>
        useClickOutside({ enabled: true, onOutsideClick, containerRef })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), true);

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('platform detection', () => {
    it('should not attach listeners on non-web platforms', () => {
      (Platform as any).OS = 'ios';
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const onOutsideClick = jest.fn();
      const containerRef = useRef<HTMLElement | null>(null);

      renderHook(() => useClickOutside({ enabled: true, onOutsideClick, containerRef }));

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      (Platform as any).OS = 'web';
    });
  });
});
