/**
 * Hook for shopping list/item reactive subscriptions.
 *
 * Backend realtime may be disabled, but cache-aware repositories already emit
 * cacheEvents on optimistic writes and confirmed updates. This hook bridges
 * those cache events back into screen-local state so cross-surface shopping
 * changes appear immediately instead of waiting for focus reloads.
 */

import { useEffect, useState } from 'react';
import type { ICacheAwareShoppingRepository } from '../../../common/repositories/cacheAwareShoppingRepository';
import type { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import { cacheEvents } from '../../../common/utils/cacheEvents';

export interface UseShoppingRealtimeOptions {
  isRealtimeEnabled: boolean;
  householdId: string | null;
  isSignedIn: boolean;
  repository: ICacheAwareShoppingRepository | null;
  groceryItems: GroceryItem[];
  listIds: string[];
  onListChange?: (lists: ShoppingList[]) => void;
  onItemChange?: (items: ShoppingItem[]) => void;
}

export interface UseShoppingRealtimeReturn {
  isSubscribed: boolean;
  error: Error | null;
}

export function useShoppingRealtime(
  options: UseShoppingRealtimeOptions
): UseShoppingRealtimeReturn {
  const {
    isRealtimeEnabled,
    householdId,
    isSignedIn,
    repository,
    onListChange,
    onItemChange,
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const isSubscribed = Boolean(isRealtimeEnabled && householdId && isSignedIn && repository);

  useEffect(() => {
    if (!isSubscribed || !repository) {
      return;
    }

    let cancelled = false;

    const handleListsChanged = async () => {
      try {
        const lists = await repository.findAllLists();
        if (!cancelled) {
          onListChange?.(lists);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError : new Error('Failed to sync shopping lists from cache'));
        }
      }
    };

    const handleItemsChanged = async () => {
      try {
        const items = await repository.findAllItems();
        if (!cancelled) {
          onItemChange?.(items);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError : new Error('Failed to sync shopping items from cache'));
        }
      }
    };

    const unsubscribeLists = cacheEvents.onCacheChange('shoppingLists', () => {
      void handleListsChanged();
    });
    const unsubscribeItems = cacheEvents.onCacheChange('shoppingItems', () => {
      void handleItemsChanged();
    });

    return () => {
      cancelled = true;
      unsubscribeLists();
      unsubscribeItems();
    };
  }, [isSubscribed, repository, onListChange, onItemChange]);

  return {
    isSubscribed,
    error,
  };
}
