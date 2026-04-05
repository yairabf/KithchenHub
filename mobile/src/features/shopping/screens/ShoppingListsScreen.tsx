import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CategoryModal } from '../components/CategoryModal';
import { ShoppingListPanel } from '../components/ShoppingListPanel';
import { CategoriesGrid } from '../components/CategoriesGrid';
import { FrequentlyAddedGrid } from '../components/FrequentlyAddedGrid';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ShareModal } from '../../../common/components/ShareModal';
import { ConfirmationModal } from '../../../common/components/ConfirmationModal';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { formatShoppingListText } from '../../../common/utils/shareUtils';
import { GrocerySearchBar, GroceryItem } from '../components/GrocerySearchBar';
import { CreateCustomItemModal } from '../components/CreateCustomItemModal';
import { CreateListModal, type ListIconName } from '../components/CreateListModal';
import { catalogService } from '../../../common/services/catalogService';
import {
  DEFAULT_CATEGORY,
  SHOPPING_CATEGORIES,
  normalizeCategoryKey,
} from '../constants/categories';
import { colors, shoppingListPickerColors } from '../../../theme';
import { styles } from './styles';
import type { ShoppingItem, ShoppingList, Category } from '../../../mocks/shopping';

/**
 * Extends ShoppingItem with optional catalog metadata needed when creating
 * items from the grocery catalog. These fields are not stored on the local
 * ShoppingItem model but are forwarded to the API for deduplication/linking.
 */
type ShoppingItemCreationPayload = Partial<ShoppingItem> & {
  catalogItemId?: string;
  masterItemId?: string;
};
import { createShoppingItem, createShoppingList, preserveLocalizedName } from '../utils/shoppingFactory';
import { createShoppingService } from '../services/shoppingService';
import { config } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';
import { getSelectedList } from '../utils/selectionUtils';
import { quickAddItem } from '../utils/quickAddUtils';
import { translateShoppingItemNames } from '../utils/catalogTranslation';
import { determineUserDataMode } from '../../../common/types/dataModes';
import { useDebouncedRemoteSearch, useResponsive } from '../../../common/hooks';
import { useCatalog } from '../../../common/hooks/useCatalog';
import {
  applyShoppingItemChange,
  applyShoppingListChange,
  buildListIdFilter,
  updateShoppingListItemCounts,
} from '../utils/shoppingRealtime';
import { useShoppingRealtime } from '../hooks/useShoppingRealtime';
import { useTranslation } from 'react-i18next';
import { CacheAwareShoppingRepository, type ICacheAwareShoppingRepository } from '../../../common/repositories/cacheAwareShoppingRepository';

/**
 * Migration key for one-time category cache clearing.
 * Used to remove deprecated categories (oils, teas, sweets) from AsyncStorage.
 * Incremented when categories change to trigger re-migration.
 */
const CATEGORY_MIGRATION_KEY = '@kitchen_hub_category_migration_v1';

/**
 * Determines if a shopping item exists only locally (not yet persisted to server).
 * Local-only items have temporary IDs starting with 'item-' prefix.
 * 
 * These items should be deleted from UI directly without API calls,
 * as they were created optimistically but not yet confirmed by the server.
 * 
 * @param item - Shopping item to check
 * @param isSignedIn - Whether user is authenticated
 * @returns True if item is local-only, false if persisted or in guest mode
 * 
 * @example
 * ```typescript
 * if (isLocalOnlyItem(item, isSignedIn)) {
 *   // Remove from UI without API call
 *   removeFromUI(item);
 * } else {
 *   // Call DELETE API endpoint
 *   await api.delete(`/items/${item.id}`);
 * }
 * ```
 */
function isLocalOnlyItem(item: ShoppingItem, isSignedIn: boolean): boolean {
  return (
    isSignedIn &&
    typeof item.id === 'string' &&
    item.id.startsWith('item-')
  );
}

interface ShoppingListsScreenProps {
  isActive?: boolean;
}

export function ShoppingListsScreen(props: ShoppingListsScreenProps = {}) {
  const { t, i18n } = useTranslation('shopping');
  const { isActive = true } = props;
  const { isTablet } = useResponsive();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    groceryItems,
    categories: rawCategories,
    frequentlyAddedItems,
    searchGroceries,
    getGroceriesByCategory,
    getCatalogDisplayNames,
  } = useCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults } = useDebouncedRemoteSearch<GroceryItem>({
    query: searchQuery,
    searchFn: searchGroceries,
    onError: (error) => {
      console.error('Search failed:', error);
    },
  });

  /**
   * Sorts categories by item count in descending order.
   * Categories with the most items appear first in the grid.
   * 
   * Uses useMemo to prevent unnecessary re-sorting on every render.
   * Only re-sorts when rawCategories array reference changes.
   * 
   * @returns Sorted array of categories (memoized)
   */
  const categories = useMemo(() => {
    return [...rawCategories].sort((a, b) => b.itemCount - a.itemCount);
  }, [rawCategories]);

  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [selectedGroceryItem, setSelectedGroceryItem] = useState<GroceryItem | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [customItemName, setCustomItemName] = useState('');
  const [selectedItemCategory, setSelectedItemCategory] = useState<string>(DEFAULT_CATEGORY.toLowerCase());
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  /**
   * Load categories for custom item selection (runs once on mount).
   * Performs one-time migration to clear deprecated categories from cache.
   *
   * The default-category guard was removed from this effect to prevent an
   * infinite loop: the old code depended on `selectedItemCategory` AND wrote
   * to it, causing the effect to re-run on every selection change.
   * Default selection is now handled as a derived value via `useMemo`.
   *
   * Migration runs only once per app installation using AsyncStorage flag.
   * After migration, loads categories normally without clearing cache.
   */
  useEffect(() => {
    let cancelled = false;

    const loadCategoriesWithMigration = async () => {
      try {
        // Check if migration has already been completed
        const migrationCompleted = await AsyncStorage.getItem(CATEGORY_MIGRATION_KEY);

        if (!migrationCompleted) {
          if (__DEV__) {
            console.log('[CategoryMigration] Clearing deprecated category cache (one-time operation)');
          }
          await catalogService.clearCache();
          await AsyncStorage.setItem(CATEGORY_MIGRATION_KEY, 'completed');
        }

        // Load categories from API or cache
        const cats = await catalogService.getShoppingCategories();

        if (cancelled) return;

        const mergedCategories = Array.from(
          new Set([...SHOPPING_CATEGORIES, ...cats].map((category) => normalizeCategoryKey(category))),
        );
        setAvailableCategories(mergedCategories);
      } catch (error) {
        if (!cancelled) {
          if (__DEV__) {
            console.error('[CategoryMigration] Failed to load categories:', error);
          }
          setAvailableCategories([...SHOPPING_CATEGORIES]);
        }
      }
    };

    loadCategoriesWithMigration();

    return () => {
      cancelled = true;
    };
  }, []); // Empty deps: runs once on mount only

  /**
   * Derives the effective category selection.
   * If the user's current selection is not present in the loaded categories
   * (e.g. first load, migration cleared cache) fall back to the first available
   * category. Keeps the category-loading effect dependency-free.
   */
  const effectiveItemCategory = useMemo(() => {
    if (
      availableCategories.length > 0 &&
      !availableCategories.includes(normalizeCategoryKey(selectedItemCategory))
    ) {
      return normalizeCategoryKey(availableCategories[0]);
    }
    return selectedItemCategory;
  }, [availableCategories, selectedItemCategory]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState<ListIconName>('cart-outline');
  const [newListColor, setNewListColor] = useState(shoppingListPickerColors[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryItems, setCategoryItems] = useState<GroceryItem[]>([]);
  const [isCategoryItemsLoading, setIsCategoryItemsLoading] = useState(false);
  const [categoryItemsError, setCategoryItemsError] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingDeleteList, setPendingDeleteList] = useState<ShoppingList | null>(null);
  const [deleteListError, setDeleteListError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const categoryRequestIdRef = useRef(0);
  const previousCategoryLanguageRef = useRef(i18n.language);
  const deletingItemIdsRef = useRef<Set<string>>(new Set());
  // Tracks whether shopping data has been successfully loaded at least once.
  // When true, subsequent cache reads happen silently without showing the loading spinner.
  const hasLoadedOnceRef = useRef(false);

  // Determine data mode based on user authentication state
  const userMode = useMemo(() => {
    if (config.mockData.enabled) {
      return 'guest' as const;
    }
    return determineUserDataMode(user);
  }, [user]);

  const isSignedIn = userMode === 'signed-in';
  const isRealtimeEnabled = isSignedIn && !!user?.householdId;

  // Create service - use directly for all modes
  const shoppingService = useMemo(
    () => createShoppingService(userMode),
    [userMode]
  );

  // Reset hasLoadedOnceRef synchronously inside useMemo so the very next
  // render (caused by the auth-state change) already reflects "not loaded yet",
  // with no one-render delay that a useEffect would introduce.
  const shoppingRepository = useMemo<ICacheAwareShoppingRepository | null>(() => {
    hasLoadedOnceRef.current = false;
    if (userMode !== 'signed-in') {
      return null;
    }
    return new CacheAwareShoppingRepository(shoppingService);
  }, [userMode, shoppingService]);

  // Use state management for all modes
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [isListsLoading, setIsListsLoading] = useState(false);
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  const fallbackList = useMemo<ShoppingList>(() => ({
    id: 'fallback-list',
    localId: 'fallback-list',
    name: 'My List',
    itemCount: 0,
    icon: 'cart-outline',
    color: colors.shopping,
    isMain: false,
  }), []);
  const activeList = selectedList ?? shoppingLists[0] ?? fallbackList;

  const listIdFilter = buildListIdFilter(shoppingLists.map((list) => list.id));

  /**
   * Sorts shopping lists so the main list always appears first.
   * 
   * @param lists - Array of shopping lists to sort
   * @returns Sorted array with main list first
   */
  const sortListsWithMainFirst = useCallback((lists: ShoppingList[]) => {
    return [...lists].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return 0;
    });
  }, []);

  // Load shopping data function - reusable for both initial load and refresh.
  // Shows loading spinner only on the first load (no data yet). Subsequent
  // tab-switch refreshes read from cache silently to avoid visible flickering.
  // Uses findAllLists/findAllItems directly to avoid the unnecessary getGroceryItems()
  // API call that getShoppingData() would trigger on every tab switch.
  const loadShoppingData = useCallback(async () => {
    if (isAuthLoading) return;

    const shouldShowLoadingSpinner = !hasLoadedOnceRef.current;
    if (shouldShowLoadingSpinner) {
      setIsListsLoading(true);
      setIsItemsLoading(true);
    }
    try {
      let lists: ShoppingList[];
      let items: ShoppingItem[];

      if (shoppingRepository) {
        [lists, items] = await Promise.all([
          shoppingRepository.findAllLists(),
          shoppingRepository.findAllItems(),
        ]);
      } else {
        const data = await shoppingService.getShoppingData();
        lists = data.shoppingLists;
        items = data.shoppingItems;
      }

      // The cache-aware repository may return items stored in a previous locale.
      // Re-apply the current locale to catalog-linked items so the user always
      // sees names in their selected language.
      const translatedItems = await translateShoppingItemNames(
        items,
        i18n.language,
        getCatalogDisplayNames,
      );

      hasLoadedOnceRef.current = true;
      const sortedLists = sortListsWithMainFirst(lists);
      setShoppingLists(sortedLists);
      setAllItems(translatedItems);
      setSelectedList((current) => getSelectedList(sortedLists, current?.id));
    } catch (error) {
      console.error('Failed to load shopping data:', error);
    } finally {
      if (shouldShowLoadingSpinner) {
        setIsListsLoading(false);
        setIsItemsLoading(false);
      }
    }
  }, [shoppingRepository, shoppingService, isAuthLoading, sortListsWithMainFirst, i18n.language, getCatalogDisplayNames]);

  // Load shopping data on mount
  useEffect(() => {
    loadShoppingData();
  }, [loadShoppingData]);

  // Track previous active state to detect when tab becomes active.
  // Initialized to null so the first effect run (on mount) is skipped — the
  // mount effect already loads data, so we only want subsequent tab activations
  // to trigger a reload.
  const prevIsActiveRef = useRef<boolean | null>(null);

  // Refresh shopping data when Shopping tab becomes active (transitions from inactive to active).
  // Skips the initial mount run to avoid a double call alongside the mount effect.
  useEffect(() => {
    if (prevIsActiveRef.current === null) {
      prevIsActiveRef.current = isActive;
      return;
    }

    const wasInactive = !prevIsActiveRef.current;
    const isNowActive = isActive;

    if (wasInactive && isNowActive) {
      loadShoppingData();
    }

    prevIsActiveRef.current = isActive;
  }, [isActive, loadShoppingData]);

  /**
   * Handles manual refresh of shopping data (pull-to-refresh).
   * Delegates the actual fetch to `loadShoppingData` so there is a
   * single source of truth for the fetch-sort-setState sequence.
   */
  // Pull-to-refresh: refresh lists first, then items derived from those same
  // lists.  Sequential ordering prevents a snapshot mismatch where refreshItems()
  // would call findAllLists() (cache-first) while refreshLists() is simultaneously
  // writing a newer list snapshot to the cache.
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (shoppingRepository) {
        await shoppingRepository.refreshAll();
      }
      await loadShoppingData();
    } finally {
      setIsRefreshing(false);
    }
  }, [shoppingRepository, loadShoppingData]);

  // Update list item counts when items change
  useEffect(() => {
    setShoppingLists((currentLists) =>
      updateShoppingListItemCounts(currentLists, allItems),
    );
  }, [allItems]);

  useEffect(() => {
    setSelectedList((currentSelected) => getSelectedList(shoppingLists, currentSelected?.id));
  }, [shoppingLists]);

  // Memoize list IDs to avoid recalculating on every render
  const listIds = useMemo(() => shoppingLists.map((list) => list.id), [shoppingLists]);

  // Memoize callbacks to prevent unnecessary re-subscriptions
  const handleRealtimeListChange = useCallback((lists: ShoppingList[]) => {
    // Sort lists so main list is always first
    const sortedLists = sortListsWithMainFirst(lists);
    setShoppingLists(sortedLists);
    setSelectedList((currentSelected) =>
      getSelectedList(sortedLists, currentSelected?.id),
    );
  }, [sortListsWithMainFirst]);

  const handleRealtimeItemChange = useCallback((items: ShoppingItem[]) => {
    setAllItems(items);
  }, []);

  // Use custom hook for realtime subscriptions
  const { error: realtimeError } = useShoppingRealtime({
    isRealtimeEnabled: isRealtimeEnabled,
    householdId: user?.householdId ?? null,
    isSignedIn,
    repository: shoppingRepository,
    groceryItems,
    listIds,
    onListChange: handleRealtimeListChange,
    onItemChange: handleRealtimeItemChange,
  });

  // Log realtime errors if any
  useEffect(() => {
    if (realtimeError) {
      console.error('Realtime subscription error:', realtimeError);
    }
  }, [realtimeError]);

  const filteredItems = useMemo(
    () => allItems.filter((item) => item.listId === activeList.id),
    [allItems, activeList.id],
  );

  const createItem = useCallback(
    (item: ShoppingItemCreationPayload) => shoppingService.createItem(item),
    [shoppingService],
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<ShoppingItem>) => shoppingService.updateItem(itemId, updates),
    [shoppingService],
  );

  const deleteItem = useCallback(
    (itemId: string) => shoppingService.deleteItem(itemId),
    [shoppingService],
  );

  const toggleItem = useCallback(
    (itemId: string) => shoppingService.toggleItem(itemId),
    [shoppingService],
  );

  const createList = useCallback(async (list: Partial<ShoppingList>) => {
    const created = await shoppingService.createList(list);
    // Read updated lists from cache (write-through cache means this is instant)
    const updatedLists = shoppingRepository
      ? await shoppingRepository.findAllLists()
      : (await shoppingService.getShoppingData()).shoppingLists;
    const sortedLists = sortListsWithMainFirst(updatedLists);
    setShoppingLists(sortedLists);
    setSelectedList((current) => getSelectedList(sortedLists, current?.id));
    return created;
  }, [shoppingRepository, shoppingService, sortListsWithMainFirst]);

  const updateList = useCallback(async (listId: string, updates: Partial<ShoppingList>) => {
    const updated = await shoppingService.updateList(listId, updates);
    setShoppingLists((currentLists) =>
      sortListsWithMainFirst(
        currentLists.map((list) =>
          list.id === listId ? { ...list, ...updated } : list,
        ),
      ),
    );
    setSelectedList((currentSelected) =>
      currentSelected && currentSelected.id === listId
        ? { ...currentSelected, ...updated }
        : currentSelected,
    );
    return updated;
  }, [shoppingService, sortListsWithMainFirst]);

  const deleteList = useCallback(async (listId: string) => {
    await shoppingService.deleteList(listId);
    setShoppingLists((currentLists) => {
      const nextLists = currentLists.filter((list) => list.id !== listId);
      const sortedLists = sortListsWithMainFirst(nextLists);
      setSelectedList((currentSelected) =>
        getSelectedList(sortedLists, currentSelected?.id === listId ? undefined : currentSelected?.id),
      );
      return sortedLists;
    });
    setAllItems((currentItems) =>
      currentItems.filter((item) => item.listId !== listId),
    );
  }, [shoppingService, sortListsWithMainFirst]);

  /**
   * Executes a service operation with optimistic UI updates and automatic revert on error.
   * This helper eliminates code duplication across handlers while maintaining responsive UX.
   *
   * @param operation - Async function that performs the service call
   * @param optimisticUpdate - Function to apply optimistic state change
   * @param revertUpdate - Function to revert state on error
   * @param errorMessage - Message logged on failure
   * @returns The result of the operation, or null if it failed
   */
  const executeWithOptimisticUpdate = useCallback(async <T,>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    revertUpdate: () => void,
    errorMessage: string,
  ): Promise<T | null> => {
    optimisticUpdate();
    try {
      return await operation();
    } catch (error) {
      revertUpdate();
      console.error(errorMessage, error);
      return null;
    }
  }, []);

  const handleQuantityChange = useCallback(async (itemId: string, delta: number) => {
    const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
    if (!targetItem) return;

    const previousQuantity = targetItem.quantity;
    const nextQuantity = Math.max(1, previousQuantity + delta);
    if (nextQuantity === previousQuantity) return;

    // Item is still being created on the server (optimistic create in flight).
    // Apply the change locally only; skip the update API call to avoid 404 errors.
    if (isLocalOnlyItem(targetItem, isSignedIn)) {
      setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
        item.id === itemId || item.localId === itemId
          ? { ...item, quantity: nextQuantity }
          : item,
      ));
      return;
    }

    await executeWithOptimisticUpdate(
      () => updateItem(itemId, { quantity: nextQuantity }),
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
          item.id === itemId || item.localId === itemId
            ? { ...item, quantity: nextQuantity }
            : item,
        ));
      },
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
          item.id === itemId || item.localId === itemId
            ? { ...item, quantity: previousQuantity }
            : item,
        ));
      },
      'Failed to update shopping item quantity:',
    );
  }, [allItems, executeWithOptimisticUpdate, updateItem]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
    if (!targetItem) return;

    const deleteById = targetItem.id;
    if (deletingItemIdsRef.current.has(deleteById)) return;

    deletingItemIdsRef.current.add(deleteById);

    // Item exists only locally (optimistic create not yet confirmed by server).
    // Remove it from UI and skip DELETE API call to avoid 404/API errors.
    if (isLocalOnlyItem(targetItem, isSignedIn)) {
      setAllItems((prev: ShoppingItem[]) =>
        prev.filter(
          (item) => item.id !== targetItem.id && item.localId !== targetItem.localId,
        ),
      );
      deletingItemIdsRef.current.delete(deleteById);
      return;
    }

    try {
      await executeWithOptimisticUpdate(
        () => deleteItem(deleteById),
        () => {
          setAllItems((prev: ShoppingItem[]) =>
            prev.filter((item) => item.id !== targetItem.id && item.localId !== targetItem.localId),
          );
        },
        () => {
          setAllItems((prev: ShoppingItem[]) => [...prev, targetItem]);
        },
        'Failed to delete shopping item:',
      );
    } finally {
      deletingItemIdsRef.current.delete(deleteById);
    }
  }, [allItems, isSignedIn, executeWithOptimisticUpdate, deleteItem]);

  const handleToggleItemChecked = useCallback(async (itemId: string) => {
    const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
    if (!targetItem) return;

    const previousChecked = targetItem.isChecked;
    const nextChecked = !previousChecked;

    // Item is still being created on the server (optimistic create in flight).
    // Apply the toggle locally only; skip the update API call to avoid 404 errors.
    if (isLocalOnlyItem(targetItem, isSignedIn)) {
      setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
        item.id === itemId || item.localId === itemId
          ? { ...item, isChecked: nextChecked }
          : item,
      ));
      return;
    }

    await executeWithOptimisticUpdate(
      () => toggleItem(itemId),
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
          item.id === itemId || item.localId === itemId
            ? { ...item, isChecked: nextChecked }
            : item,
        ));
      },
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
          item.id === itemId || item.localId === itemId
            ? { ...item, isChecked: previousChecked }
            : item,
        ));
      },
      'Failed to toggle shopping item:',
    );
  }, [allItems, executeWithOptimisticUpdate, toggleItem]);

  const handleSelectGroceryItem = useCallback((groceryItem: GroceryItem) => {
    setSelectedGroceryItem(groceryItem);
    setQuantityInput('1');
    if (groceryItem.id.startsWith('custom-')) {
      setSelectedItemCategory(DEFAULT_CATEGORY.toLowerCase());
      setCustomItemName(groceryItem.name);
    } else {
      setCustomItemName('');
    }
    setShowQuantityModal(true);
  }, []);

  const handleQuickAddItem = useCallback(async (groceryItem: GroceryItem) => {
    await quickAddItem(groceryItem, activeList, {
      allItems,
      setAllItems,
      createItem,
      updateItem,
      executeWithOptimisticUpdate,
      logError: (msg, err) => console.error(msg, err),
    });
  }, [activeList, allItems, createItem, updateItem, executeWithOptimisticUpdate]);

  const handleAddToList = useCallback(async () => {
    if (!selectedGroceryItem) return;

    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    const itemName = selectedGroceryItem.id.startsWith('custom-')
      ? customItemName.trim()
      : selectedGroceryItem.name;

    if (!itemName) return;

    const existingItem = allItems.find(
      (item) => item.name === itemName && item.listId === activeList.id,
    );

    if (existingItem) {
      const itemId = existingItem.id;
      const itemLocalId = existingItem.localId;
      const baseQuantity = existingItem.quantity;

      // nextQuantity is computed once from the snapshot at click-time and
      // reused in both the optimistic update and the API call.  Using the
      // same value avoids reading stale `allItems` inside an async closure.
      const nextQuantity = baseQuantity + quantity;

      await executeWithOptimisticUpdate(
        () => updateItem(itemId, { quantity: nextQuantity }),
        () => {
          setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
            if (item.id === itemId || item.localId === itemLocalId) {
              return { ...item, quantity: nextQuantity };
            }
            return item;
          }));
        },
        () => {
          setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
            if (item.id === itemId || item.localId === itemLocalId) {
              return { ...item, quantity: baseQuantity };
            }
            return item;
          }));
        },
        'Failed to update shopping item quantity:',
      );
    } else {
      const tempItem = createShoppingItem(
        { ...selectedGroceryItem, name: itemName },
        activeList.id,
        quantity,
      );
      setAllItems((prev: ShoppingItem[]) => [...prev, tempItem]);

      try {
        const categoryToUse = selectedGroceryItem.id.startsWith('custom-')
          ? normalizeCategoryKey(effectiveItemCategory)
          : selectedGroceryItem.category;

        const payload: ShoppingItemCreationPayload = {
          name: itemName,
          listId: activeList.id,
          quantity,
          category: categoryToUse,
          image: selectedGroceryItem.image,
          catalogItemId: selectedGroceryItem.id.startsWith('custom-') ? undefined : selectedGroceryItem.id,
        };
        const newItem = await createItem(payload);

        const confirmedItem = preserveLocalizedName(newItem, tempItem.name);

        setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
          item.localId === tempItem.localId ? confirmedItem : item,
        ));
      } catch (error) {
        setAllItems((prev: ShoppingItem[]) => prev.filter((item) => item.localId !== tempItem.localId));
        console.error('Failed to create shopping item:', error);
      }
    }

    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setCustomItemName('');
    setQuantityInput('1');
  }, [
    selectedGroceryItem, quantityInput, customItemName, allItems, activeList,
    effectiveItemCategory, executeWithOptimisticUpdate, updateItem, createItem,
  ]);

  const handleCancelQuantityModal = useCallback(() => {
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setCustomItemName('');
    setQuantityInput('1');
    setSelectedItemCategory(DEFAULT_CATEGORY.toLowerCase());
  }, []);

  const handleQuantityInputChange = useCallback((delta: number) => {
    const current = parseInt(quantityInput, 10) || 0;
    const newValue = Math.max(1, current + delta);
    setQuantityInput(newValue.toString());
  }, [quantityInput]);

  const handleOpenCreateListModal = useCallback(() => {
    setEditingList(null);
    setShowCreateListModal(true);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor('#10B981');
  }, []);

  const handleOpenEditListModal = useCallback((list: ShoppingList) => {
    setEditingList(list);
    setShowCreateListModal(true);
    setNewListName(list.name);
    setNewListIcon(list.icon);
    setNewListColor(list.color);
  }, []);

  const handleCancelCreateListModal = useCallback(() => {
    setShowCreateListModal(false);
    setEditingList(null);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor(shoppingListPickerColors[0]);
  }, []);

  const handleCreateList = useCallback(() => {
    const trimmedName = newListName.trim();
    if (!trimmedName) return;

    if (editingList) {
      const optimisticUpdates = { name: trimmedName, icon: newListIcon, color: newListColor };
      const previousList = shoppingLists.find((l) => l.id === editingList.id);
      const previousSelected = selectedList;

      setShoppingLists((currentLists) =>
        sortListsWithMainFirst(
          currentLists.map((list) =>
            list.id === editingList.id ? { ...list, ...optimisticUpdates } : list,
          ),
        ),
      );
      setSelectedList((currentSelected) =>
        currentSelected?.id === editingList.id
          ? { ...currentSelected, ...optimisticUpdates }
          : currentSelected,
      );
      handleCancelCreateListModal();

      updateList(editingList.id, optimisticUpdates).catch((error) => {
        console.error('Failed to save shopping list:', error);
        if (previousList) {
          setShoppingLists((currentLists) =>
            sortListsWithMainFirst(
              currentLists.map((list) => (list.id === editingList.id ? previousList : list)),
            ),
          );
          setSelectedList((currentSelected) =>
            currentSelected?.id === editingList.id ? previousSelected : currentSelected,
          );
        }
      });
    } else {
      const icon = newListIcon;
      const color = newListColor;
      handleCancelCreateListModal();

      createList({ name: trimmedName, icon, color })
        .then((newList) => setSelectedList(newList))
        .catch((error) => {
          console.error('Failed to create shopping list:', error);
        });
    }
  }, [newListName, editingList, newListIcon, newListColor, updateList, createList, handleCancelCreateListModal, sortListsWithMainFirst, shoppingLists, selectedList]);

  const confirmDeleteList = useCallback((list: ShoppingList) => {
    if (list.isMain) return;
    setDeleteListError(null);
    setPendingDeleteList(list);
  }, []);

  const handleConfirmDeleteList = useCallback(() => {
    if (!pendingDeleteList) return;

    const listToDelete = pendingDeleteList;
    const originalIndex = shoppingLists.findIndex((l) => l.id === listToDelete.id);
    const itemsToRestore = allItems.filter((item) => item.listId === listToDelete.id);
    const previousSelected = selectedList;

    const nextLists = sortListsWithMainFirst(
      shoppingLists.filter((list) => list.id !== listToDelete.id),
    );
    const nextSelectedId =
      selectedList?.id === listToDelete.id ? undefined : selectedList?.id;
    const nextSelected = getSelectedList(nextLists, nextSelectedId);

    setShoppingLists(nextLists);
    setSelectedList(nextSelected);
    setAllItems((currentItems) => currentItems.filter((item) => item.listId !== listToDelete.id));
    setPendingDeleteList(null);
    setDeleteListError(null);

    shoppingService.deleteList(listToDelete.id).catch((error) => {
      console.error('Failed to delete shopping list:', error);
      setShoppingLists((currentLists) => {
        const restored = [...currentLists];
        restored.splice(originalIndex, 0, listToDelete);
        return sortListsWithMainFirst(restored);
      });
      setAllItems((currentItems) => [...currentItems, ...itemsToRestore]);
      setSelectedList(previousSelected);
      setDeleteListError(t('screen.deleteListError'));
      setPendingDeleteList(listToDelete);
    });
  }, [pendingDeleteList, allItems, shoppingLists, selectedList, shoppingService, sortListsWithMainFirst, t]);

  const handleCategoryClick = useCallback(async (categoryName: string) => {
    const requestId = categoryRequestIdRef.current + 1;
    categoryRequestIdRef.current = requestId;

    setSelectedCategory(categoryName);
    setCategoryItems([]);
    setCategoryItemsError(null);
    setIsCategoryItemsLoading(true);
    setShowCategoryModal(true);

    try {
      const items = await getGroceriesByCategory(categoryName);
      if (categoryRequestIdRef.current === requestId) {
        setCategoryItems(items);
      }
    } catch (error) {
      console.error('Failed to load category items:', error);
      if (categoryRequestIdRef.current === requestId) {
        setCategoryItemsError(t('categoryModal.loadFailed'));
      }
    } finally {
      if (categoryRequestIdRef.current === requestId) {
        setIsCategoryItemsLoading(false);
      }
    }
  }, [getGroceriesByCategory, t]);

  useEffect(() => {
    const previousLanguage = previousCategoryLanguageRef.current;
    const currentLanguage = i18n.language;
    const hasLanguageChanged = previousLanguage !== currentLanguage;
    previousCategoryLanguageRef.current = currentLanguage;

    if (!hasLanguageChanged) {
      return;
    }

    // Re-fetch whenever the language changes and a category was previously loaded,
    // regardless of whether the modal is currently open. Without this, items fetched
    // before i18n detection resolved (English fallback) are never corrected after
    // the modal is closed.
    if (!selectedCategory) {
      return;
    }

    const requestId = categoryRequestIdRef.current + 1;
    categoryRequestIdRef.current = requestId;
    setCategoryItemsError(null);

    // Only show the loading spinner when the modal is visible — if the re-fetch
    // runs in the background (modal closed), updating the items silently avoids
    // a loading-state flash the next time the modal opens.
    if (showCategoryModal) {
      setIsCategoryItemsLoading(true);
    }

    void (async () => {
      try {
        const items = await getGroceriesByCategory(selectedCategory);
        if (categoryRequestIdRef.current === requestId) {
          setCategoryItems(items);
        }
      } catch (error) {
        console.error('Failed to refresh category items after language change:', error);
        if (categoryRequestIdRef.current === requestId) {
          setCategoryItemsError(t('categoryModal.loadFailed'));
        }
      } finally {
        if (categoryRequestIdRef.current === requestId) {
          setIsCategoryItemsLoading(false);
        }
      }
    })();
    // Only run when language changes; selectedCategory guards against a fetch with no active category.
    // showCategoryModal/selectedCategory intentionally omitted from deps to avoid re-running on modal open.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: selectedCategory and showCategoryModal are read but not deps
  }, [i18n.language, getGroceriesByCategory, t]);

  const handleCloseCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setSelectedCategory('');
    setCategoryItems([]);
    setCategoryItemsError(null);
    setIsCategoryItemsLoading(false);
  }, []);

  const handleSelectItemFromCategory = useCallback((groceryItem: GroceryItem) => {
    setShowCategoryModal(false);
    handleSelectGroceryItem(groceryItem);
  }, [handleSelectGroceryItem]);

  // Format shopping list for sharing.
  // `t` already gets a new reference on language change (via useTranslation),
  // so listing i18n.language explicitly as a dep is redundant.
  const shareText = useMemo(
    () => formatShoppingListText(activeList.name, filteredItems, t),
    [activeList.name, filteredItems, t],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('screen.headerTitle')}
        titleIcon="basket-outline"
        rightActions={{
          share: { onPress: () => setShowShareModal(true), label: t('screen.shareActionLabel') },
          add: { onPress: () => setShowQuickAddModal(true), label: t('screen.addActionLabel') },
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[styles.mainGrid, !isTablet && styles.mainGridPhone]}>
          {/* Left Column - Shopping List */}
          <ShoppingListPanel
            shoppingLists={shoppingLists}
            selectedList={activeList}
            filteredItems={filteredItems}
            groceryItems={searchQuery ? searchResults : []}
            onSelectList={(list) => setSelectedList(list)}
            onCreateList={handleOpenCreateListModal}
            onEditList={handleOpenEditListModal}
            onDeleteList={confirmDeleteList}
            onSelectGroceryItem={handleSelectGroceryItem}
            onQuickAddItem={handleQuickAddItem}
            onQuantityChange={handleQuantityChange}
            onDeleteItem={handleDeleteItem}
            onToggleItemChecked={handleToggleItemChecked}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchMode="remote"
            isLoading={isItemsLoading}
          />

          {/* Right Column - Discovery */}
          <View style={[styles.rightColumn, !isTablet && styles.rightColumnPhone]}>
            <FrequentlyAddedGrid
              items={frequentlyAddedItems}
              onItemPress={handleQuickAddItem}
            />
            <CategoriesGrid
              categories={categories}
              onCategoryPress={handleCategoryClick}
            />
          </View>
        </View>
      </ScrollView>

      <CreateCustomItemModal
        visible={showQuantityModal}
        onClose={handleCancelQuantityModal}
        onConfirm={handleAddToList}
        listName={activeList.name}
        confirmColor={activeList.color}
        selectedGroceryItem={selectedGroceryItem}
        selectedItemCategory={effectiveItemCategory}
        customItemName={customItemName}
        onSelectCategory={setSelectedItemCategory}
        onChangeCustomItemName={setCustomItemName}
        availableCategories={availableCategories}
        quantityInput={quantityInput}
        onChangeQuantity={setQuantityInput}
        onDecreaseQuantity={() => handleQuantityInputChange(-1)}
        onIncreaseQuantity={() => handleQuantityInputChange(1)}
      />

      <CreateListModal
        visible={showCreateListModal}
        onClose={handleCancelCreateListModal}
        onConfirm={handleCreateList}
        confirmDisabled={!newListName.trim()}
        mode={editingList ? 'edit' : 'create'}
        listName={newListName}
        onChangeListName={setNewListName}
        selectedIcon={newListIcon}
        onSelectIcon={setNewListIcon}
        selectedColor={newListColor}
        onSelectColor={setNewListColor}
      />

      {/* Category Modal */}
      <CategoryModal
        visible={showCategoryModal}
        categoryName={selectedCategory}
        items={categoryItems}
        isLoading={isCategoryItemsLoading}
        errorMessage={categoryItemsError}
        onClose={handleCloseCategoryModal}
        onSelectItem={handleSelectItemFromCategory}
      />

      {/* Quick Add Modal */}
      <CenteredModal
        visible={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        title={t('screen.quickAddTitle')}
        showActions={false}
      >
        <View>
          {/* List Switcher */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickAddListSwitcher}
            contentContainerStyle={styles.quickAddListSwitcherContent}
          >
            {shoppingLists.map(list => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.quickAddListBubble,
                  activeList.id === list.id && { backgroundColor: list.color },
                ]}
                onPress={() => setSelectedList(list)}
                accessibilityLabel={t('screen.switchToList', { name: list.name })}
                accessibilityRole="button"
                accessibilityState={{ selected: activeList.id === list.id }}
              >
                <Text
                  style={[
                    styles.quickAddListBubbleText,
                    activeList.id === list.id && { color: colors.textLight },
                  ]}
                >
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Bar */}
          <GrocerySearchBar
            items={groceryItems}
            onSelectItem={(item) => {
              setShowQuickAddModal(false);
              handleSelectGroceryItem(item);
            }}
            onQuickAddItem={handleQuickAddItem}
            variant="background"
            showShadow={false}
            allowCustomItems={true}
          />
        </View>
      </CenteredModal>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={t('screen.shareTitle', { name: activeList.name })}
        shareText={shareText}
      />

      <ConfirmationModal
        visible={!!pendingDeleteList}
        title={t('screen.deleteListTitle')}
        message={
          pendingDeleteList
            ? t('screen.deleteListMessage', { name: pendingDeleteList.name })
            : ''
        }
        errorMessage={deleteListError ?? undefined}
        confirmText={t('screen.deleteListConfirm')}
        onConfirm={handleConfirmDeleteList}
        onCancel={() => {
          setPendingDeleteList(null);
          setDeleteListError(null);
        }}
      />

    </SafeAreaView>
  );
}
