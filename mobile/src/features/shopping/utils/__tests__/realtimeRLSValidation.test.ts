/**
 * Realtime RLS validation tests.
 *
 * Realtime is disabled; shopping data is fetched via the backend API only.
 * These tests verify the useShoppingRealtime hook returns the expected shape.
 */

import { renderHook } from '@testing-library/react-native';
import { useShoppingRealtime } from '../../hooks/useShoppingRealtime';
import type { ICacheAwareShoppingRepository } from '../../../../common/repositories/cacheAwareShoppingRepository';

const mockRepository = {
  applyRealtimeListChange: jest.fn().mockResolvedValue(undefined),
  applyRealtimeItemChange: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<ICacheAwareShoppingRepository>;

describe('Realtime RLS Validation', () => {
  it('hook returns isSubscribed false when realtime is disabled', () => {
    const { result } = renderHook(() =>
      useShoppingRealtime({
        isRealtimeEnabled: true,
        householdId: 'household-1',
        isSignedIn: true,
        repository: mockRepository,
        groceryItems: [],
        listIds: ['list-1'],
      })
    );
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
