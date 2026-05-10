/**
 * Tests for useShoppingRealtime hook.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useShoppingRealtime } from '../useShoppingRealtime';
import type { ICacheAwareShoppingRepository } from '../../../../common/repositories/cacheAwareShoppingRepository';
import type { GroceryItem } from '../../components/GrocerySearchBar';
import { cacheEvents } from '../../../../common/utils/cacheEvents';

const mockFindAllLists = jest.fn();
const mockFindAllItems = jest.fn();

const defaultOptions = {
  isRealtimeEnabled: true,
  householdId: 'household-1',
  isSignedIn: true,
  repository: {
    findAllLists: mockFindAllLists,
    findAllItems: mockFindAllItems,
  } as unknown as ICacheAwareShoppingRepository,
  groceryItems: [] as GroceryItem[],
  listIds: ['list-1'],
  onListChange: undefined as ((lists: never[]) => void) | undefined,
  onItemChange: undefined as ((items: never[]) => void) | undefined,
};

describe('useShoppingRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheEvents.removeAllListeners();
    mockFindAllLists.mockResolvedValue([{ id: 'list-1', name: 'Main List', isMain: true }]);
    mockFindAllItems.mockResolvedValue([{ id: 'item-1', name: 'Milk', listId: 'list-1', quantity: 1 }]);
  });

  afterEach(() => {
    cacheEvents.removeAllListeners();
  });

  it('subscribes to cache change events for signed-in users with a repository', async () => {
    const onListChange = jest.fn();
    const onItemChange = jest.fn();

    const { result } = renderHook(() => useShoppingRealtime({
      ...defaultOptions,
      onListChange,
      onItemChange,
    }));

    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.error).toBeNull();

    cacheEvents.emitCacheChange('shoppingLists');
    cacheEvents.emitCacheChange('shoppingItems');

    await waitFor(() => {
      expect(onListChange).toHaveBeenCalledWith([{ id: 'list-1', name: 'Main List', isMain: true }]);
      expect(onItemChange).toHaveBeenCalledWith([{ id: 'item-1', name: 'Milk', listId: 'list-1', quantity: 1 }]);
    });
  });

  it('stays disabled when realtime prerequisites are missing', () => {
    const { result } = renderHook(() => useShoppingRealtime({
      ...defaultOptions,
      isRealtimeEnabled: false,
      householdId: null,
      repository: null,
    }));
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
