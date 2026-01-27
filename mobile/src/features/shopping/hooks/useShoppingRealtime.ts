/**
 * Custom hook for managing shopping list/item realtime subscriptions
 * 
 * Decouples realtime subscription logic from UI components, following composition patterns.
 * Handles both signed-in (cache-based) and guest (state-based) modes.
 * 
 * This hook:
 * - Sets up Supabase realtime subscriptions for shopping_lists and shopping_items tables
 * - Filters subscriptions by household_id for security (RLS)
 * - Updates cache for signed-in users via repository methods
 * - Updates local state for guest users via callbacks
 * - Handles cleanup on unmount or dependency changes
 * 
 * @param options - Configuration for realtime subscriptions
 * @returns Object with subscription status and error state
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';
import type { ICacheAwareShoppingRepository } from '../../../common/repositories/cacheAwareShoppingRepository';
import type { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import { applyShoppingListChange, applyShoppingItemChange, buildListIdFilter } from '../utils/shoppingRealtime';

type ShoppingListRealtimeRow = {
  id: string;
  name?: string | null;
  color?: string | null;
  household_id?: string | null;
};

type ShoppingItemRealtimeRow = {
  id: string;
  list_id?: string | null;
  name?: string | null;
  quantity?: number | null;
  category?: string | null;
  is_checked?: boolean | null;
};

export interface UseShoppingRealtimeOptions {
  /** Whether realtime subscriptions should be enabled */
  isRealtimeEnabled: boolean;
  /** Household ID for filtering subscriptions (RLS) */
  householdId: string | null;
  /** Whether user is signed in (determines update strategy) */
  isSignedIn: boolean;
  /** Repository instance for signed-in users (null for guest mode) */
  repository: ICacheAwareShoppingRepository | null;
  /** Grocery items for matching item metadata */
  groceryItems: GroceryItem[];
  /** List IDs to filter item subscriptions */
  listIds: string[];
  /** Callback for guest mode list changes */
  onListChange?: (lists: ShoppingList[]) => void;
  /** Callback for guest mode item changes */
  onItemChange?: (items: ShoppingItem[]) => void;
}

export interface UseShoppingRealtimeReturn {
  /** Whether subscriptions are currently active */
  isSubscribed: boolean;
  /** Error if subscription setup failed */
  error: Error | null;
}

/**
 * Custom hook for managing shopping list/item realtime subscriptions
 */
export function useShoppingRealtime(
  options: UseShoppingRealtimeOptions
): UseShoppingRealtimeReturn {
  const {
    isRealtimeEnabled,
    householdId,
    isSignedIn,
    repository,
    groceryItems,
    listIds,
    onListChange,
    onItemChange,
  } = options;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Store current lists/items for guest mode updates
  const guestListsRef = useRef<ShoppingList[]>([]);
  const guestItemsRef = useRef<ShoppingItem[]>([]);

  // Memoize listIds as string for stable dependency comparison
  const listIdsKey = useMemo(() => listIds.join(','), [listIds]);

  useEffect(() => {
    // Early return if realtime is not enabled or household ID is missing
    if (!isRealtimeEnabled || !householdId) {
      setIsSubscribed(false);
      return;
    }

    let listChannel: ReturnType<typeof supabase.channel> | null = null;
    let itemChannel: ReturnType<typeof supabase.channel> | null = null;

    try {
      // Set up list subscription
      listChannel = supabase.channel(`shopping-lists-${householdId}`);

      listChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload) => {
          try {
            const typedPayload = payload as RealtimePostgresChangesPayload<ShoppingListRealtimeRow>;

            if (isSignedIn && repository) {
              // Signed-in: update cache via repository
              void repository.applyRealtimeListChange(typedPayload);
            } else if (!isSignedIn && onListChange) {
              // Guest: update local state via callback
              guestListsRef.current = applyShoppingListChange(guestListsRef.current, typedPayload);
              onListChange(guestListsRef.current);

              // If list was deleted, also remove associated items
              if (typedPayload.eventType === 'DELETE' && onItemChange) {
                const deletedId = typedPayload.old?.id;
                if (deletedId) {
                  guestItemsRef.current = guestItemsRef.current.filter(
                    (item) => item.listId !== deletedId
                  );
                  onItemChange(guestItemsRef.current);
                }
              }
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error handling realtime list change:', errorMessage, err);
            setError(err instanceof Error ? err : new Error(errorMessage));
          }
        }
      );

      listChannel.subscribe();

      // Set up item subscription (only if we have list IDs to filter)
      const listIdFilter = buildListIdFilter(listIds);
      if (listIdFilter) {
        itemChannel = supabase.channel(`shopping-items-${householdId}`);

        itemChannel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_items',
            filter: listIdFilter,
          },
          async (payload) => {
            try {
              const typedPayload = payload as RealtimePostgresChangesPayload<ShoppingItemRealtimeRow>;

              if (isSignedIn && repository) {
                // Signed-in: update cache via repository
                void repository.applyRealtimeItemChange(typedPayload, groceryItems);
              } else if (!isSignedIn && onItemChange) {
                // Guest: update local state via callback
                guestItemsRef.current = applyShoppingItemChange(
                  guestItemsRef.current,
                  typedPayload,
                  groceryItems
                );
                onItemChange(guestItemsRef.current);
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              console.error('Error handling realtime item change:', errorMessage, err);
              setError(err instanceof Error ? err : new Error(errorMessage));
            }
          }
        );

        itemChannel.subscribe();
      }

      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set up realtime subscriptions';
      console.error(errorMessage, err);
      setError(err instanceof Error ? err : new Error(errorMessage));
      setIsSubscribed(false);
    }

    // Cleanup function
    return () => {
      if (listChannel) {
        listChannel.unsubscribe();
        supabase.removeChannel(listChannel);
      }
      if (itemChannel) {
        itemChannel.unsubscribe();
        supabase.removeChannel(itemChannel);
      }
      setIsSubscribed(false);
    };
  }, [
    isRealtimeEnabled,
    householdId,
    isSignedIn,
    repository,
    groceryItems,
    listIdsKey, // Stable string representation of listIds array
    onListChange,
    onItemChange,
  ]);

  return {
    isSubscribed,
    error,
  };
}
