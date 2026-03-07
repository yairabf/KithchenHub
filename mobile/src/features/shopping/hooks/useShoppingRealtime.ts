/**
 * Hook for shopping list/item realtime subscriptions.
 *
 * Realtime is currently disabled: all shopping data is read/written via the backend API.
 * This hook is a no-op and returns { isSubscribed: false, error: null }.
 * The UI still works; list updates appear on next fetch/refresh.
 */

import { useState } from 'react';
import type { ICacheAwareShoppingRepository } from '../../../common/repositories/cacheAwareShoppingRepository';
import type { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';

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

/**
 * No-op realtime hook. All shopping requests go through the backend; updates on refresh.
 */
export function useShoppingRealtime(
  _options: UseShoppingRealtimeOptions
): UseShoppingRealtimeReturn {
  const [error] = useState<Error | null>(null);
  return {
    isSubscribed: false,
    error,
  };
}
