/**
 * Tests for useShoppingRealtime hook.
 *
 * Realtime is disabled; the hook is a no-op. All shopping data goes through the backend API.
 */

import { renderHook } from '@testing-library/react-native';
import { useShoppingRealtime } from '../useShoppingRealtime';
import type { ICacheAwareShoppingRepository } from '../../../../common/repositories/cacheAwareShoppingRepository';
import type { GroceryItem } from '../../components/GrocerySearchBar';

const defaultOptions = {
  isRealtimeEnabled: true,
  householdId: 'household-1',
  isSignedIn: true,
  repository: null as ICacheAwareShoppingRepository | null,
  groceryItems: [] as GroceryItem[],
  listIds: ['list-1'],
  onListChange: undefined as ((lists: never[]) => void) | undefined,
  onItemChange: undefined as ((items: never[]) => void) | undefined,
};

describe('useShoppingRealtime', () => {
  it('returns isSubscribed false and error null (realtime disabled)', () => {
    const { result } = renderHook(() => useShoppingRealtime(defaultOptions));
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('accepts options without throwing', () => {
    expect(() =>
      renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          isRealtimeEnabled: false,
          householdId: null,
        })
      )
    ).not.toThrow();
  });
});
