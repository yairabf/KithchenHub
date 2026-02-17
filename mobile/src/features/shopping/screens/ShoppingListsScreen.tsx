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
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
import { colors } from '../../../theme';
import { styles } from './styles';
import type { ShoppingItem, ShoppingList, Category } from '../../../mocks/shopping';
import { createShoppingItem, createShoppingList } from '../utils/shoppingFactory';
import { createShoppingService } from '../services/shoppingService';
import { config } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';
import { getSelectedList } from '../utils/selectionUtils';
import { quickAddItem } from '../utils/quickAddUtils';
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

/**
 * Migration key for one-time category cache clearing.
 * Used to remove deprecated categories (oils, teas, sweets) from AsyncStorage.
 * Incremented when categories change to trigger re-migration.
 */
const CATEGORY_MIGRATION_KEY = '@kitchen_hub_category_migration_v1';

interface ShoppingListsScreenProps {
  isActive?: boolean;
}

export function ShoppingListsScreen(props: ShoppingListsScreenProps = {}) {
  const { isActive = true } = props;
  const { isTablet } = useResponsive();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    groceryItems,
    categories: rawCategories,
    frequentlyAddedItems,
    searchGroceries,
    getGroceriesByCategory,
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
  const [selectedItemCategory, setSelectedItemCategory] = useState<string>(DEFAULT_CATEGORY.toLowerCase());
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  /**
   * Load categories for custom item selection.
   * Performs one-time migration to clear deprecated categories from cache.
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

        // Prevent state updates if component unmounted during async operation
        if (cancelled) return;

        const mergedCategories = Array.from(
          new Set([...SHOPPING_CATEGORIES, ...cats].map((category) => normalizeCategoryKey(category))),
        );
        setAvailableCategories(mergedCategories);

        // Set default category if current selection is not in the list
        const normalizedSelected = normalizeCategoryKey(selectedItemCategory);
        if (mergedCategories.length > 0 && !mergedCategories.includes(normalizedSelected)) {
          setSelectedItemCategory(normalizeCategoryKey(mergedCategories[0]));
        }
      } catch (error) {
        if (!cancelled) {
          if (__DEV__) {
            console.error('[CategoryMigration] Failed to load categories:', error);
          }
          // Fallback to static categories on error (convert readonly to mutable array)
          setAvailableCategories([...SHOPPING_CATEGORIES]);
        }
      }
    };

    loadCategoriesWithMigration();

    // Cleanup: prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [selectedItemCategory]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState<ListIconName>('cart-outline');
  const [newListColor, setNewListColor] = useState('#10B981');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryItems, setCategoryItems] = useState<GroceryItem[]>([]);
  const [isCategoryItemsLoading, setIsCategoryItemsLoading] = useState(false);
  const [categoryItemsError, setCategoryItemsError] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingDeleteList, setPendingDeleteList] = useState<ShoppingList | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const categoryRequestIdRef = useRef(0);

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

  // Use state management for all modes (no cache)
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

  // Load shopping data function - reusable for both initial load and refresh
  const loadShoppingData = useCallback(async () => {
    if (isAuthLoading) return;

    setIsListsLoading(true);
    setIsItemsLoading(true);
    try {
      const data = await shoppingService.getShoppingData();
      // Sort lists so main list is always first
      const sortedLists = sortListsWithMainFirst(data.shoppingLists);
      setShoppingLists(sortedLists);
      setAllItems(data.shoppingItems);
      setSelectedList((current) => getSelectedList(sortedLists, current?.id));
    } catch (error) {
      console.error('Failed to load shopping data:', error);
    } finally {
      setIsListsLoading(false);
      setIsItemsLoading(false);
    }
  }, [shoppingService, isAuthLoading, sortListsWithMainFirst]);

  // Load shopping data on mount
  useEffect(() => {
    loadShoppingData();
  }, [loadShoppingData]);

  // Track previous active state to detect when tab becomes active
  const prevIsActiveRef = useRef<boolean>(false);

  // Refresh shopping data when Shopping tab becomes active (transitions from inactive to active)
  useEffect(() => {
    const wasInactive = !prevIsActiveRef.current;
    const isNowActive = isActive;

    // Only refresh when transitioning from inactive to active
    if (wasInactive && isNowActive) {
      loadShoppingData();
    }

    // Update ref for next comparison
    prevIsActiveRef.current = isActive;
  }, [isActive, loadShoppingData]);

  /**
   * Handles manual refresh of shopping data (pull-to-refresh).
   * Fetches latest data from the service and updates state.
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await shoppingService.getShoppingData();
      // Sort lists so main list is always first
      const sortedLists = sortListsWithMainFirst(data.shoppingLists);
      setShoppingLists(sortedLists);
      setAllItems(data.shoppingItems);
      setSelectedList((current) => getSelectedList(sortedLists, current?.id));
    } catch (error) {
      console.error('Failed to refresh shopping data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
    repository: null, // No repository - direct API calls
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

  // Filter items based on selected list
  const filteredItems = allItems.filter(item => item.listId === activeList.id);

  const logShoppingError = (message: string, error: unknown) => {
    console.error(message, error);
  };

  // Use service directly for all operations (no cache)
  // Accepts ShoppingItemWithCatalog to support catalogItemId/masterItemId for API requests
  type ShoppingItemWithCatalog = Partial<ShoppingItem> & {
    catalogItemId?: string;
    masterItemId?: string;
  };

  const createItem = async (item: ShoppingItemWithCatalog) => {
    // Optimistic update handles UI, realtime will sync the actual creation
    return await shoppingService.createItem(item);
  };

  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    // Optimistic update handles UI, realtime will sync the actual update
    return await shoppingService.updateItem(itemId, updates);
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic update handles UI, realtime will sync the actual deletion
    await shoppingService.deleteItem(itemId);
  };

  const toggleItem = async (itemId: string) => {
    // Optimistic update handles UI, realtime will sync the actual toggle
    return await shoppingService.toggleItem(itemId);
  };

  const createList = async (list: Partial<ShoppingList>) => {
    const created = await shoppingService.createList(list);
    // For list creation, we need to update the lists state since realtime might not catch it immediately
    const data = await shoppingService.getShoppingData();
    const sortedLists = sortListsWithMainFirst(data.shoppingLists);
    setShoppingLists(sortedLists);
    setSelectedList((current) => getSelectedList(sortedLists, current?.id));
    return created;
  };

  const updateList = async (listId: string, updates: Partial<ShoppingList>) => {
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
  };

  const deleteList = async (listId: string) => {
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
  };

  /**
   * Executes a service operation with optimistic UI updates and automatic revert on error.
   * This helper eliminates code duplication across handlers while maintaining responsive UX.
   * 
   * @param operation - Async function that performs the service call
   * @param optimisticUpdate - Function to apply optimistic state change
   * @param revertUpdate - Function to revert state on error
   * @param errorMessage - Error message for logging
   * @returns The result of the operation, or null if it failed
   * 
   * @example
   * ```typescript
   * await executeWithOptimisticUpdate(
   *   () => toggleItem(itemId),
   *   () => {
   *     if (!isSignedIn) {
   *       setAllItems(prev => prev.map(item => 
   *         item.id === itemId ? {...item, isChecked: true} : item
   *       ));
   *     }
   *   },
   *   () => {
   *     if (!isSignedIn) {
   *       setAllItems(prev => prev.map(item => 
   *         item.id === itemId ? {...item, isChecked: false} : item
   *       ));
   *     }
   *   },
   *   'Failed to toggle item:'
   * );
   * ```
   */
  const executeWithOptimisticUpdate = async <T,>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    revertUpdate: () => void,
    errorMessage: string
  ): Promise<T | null> => {
    // Apply optimistic updates for all modes
    optimisticUpdate();
    try {
      return await operation();
    } catch (error) {
      revertUpdate();
      logShoppingError(errorMessage, error);
      return null;
    }
  };


  const handleQuantityChange = async (itemId: string, delta: number) => {
    const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
    if (!targetItem) {
      return;
    }

    const previousQuantity = targetItem.quantity;
    const nextQuantity = Math.max(1, previousQuantity + delta);
    if (nextQuantity === previousQuantity) {
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
      'Failed to update shopping item quantity:'
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
    if (!targetItem) {
      return;
    }

    await executeWithOptimisticUpdate(
      () => deleteItem(itemId),
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.filter((item) => item.id !== itemId && item.localId !== itemId));
      },
      () => {
        setAllItems((prev: ShoppingItem[]) => [...prev, targetItem]);
      },
      'Failed to delete shopping item:'
    );
  };

  const handleToggleItemChecked = async (itemId: string) => {
    const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
    if (!targetItem) {
      return;
    }

    const previousChecked = targetItem.isChecked;
    const nextChecked = !previousChecked;

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
      'Failed to toggle shopping item:'
    );
  };

  const handleSelectGroceryItem = (groceryItem: GroceryItem) => {
    setSelectedGroceryItem(groceryItem);
    setQuantityInput('1');
    // Reset category to default for custom items
    if (groceryItem.id.startsWith('custom-')) {
      setSelectedItemCategory(DEFAULT_CATEGORY.toLowerCase());
    }
    setShowQuantityModal(true);
    // Keep dropdown open so user can continue adding items after modal closes
  };

  const handleQuickAddItem = async (groceryItem: GroceryItem) => {
    await quickAddItem(groceryItem, activeList, {
      allItems,
      setAllItems,
      createItem,
      updateItem,
      executeWithOptimisticUpdate,
      logShoppingError,
    });
  };

  const handleAddToList = async () => {
    if (!selectedGroceryItem) return;

    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    // Check if item already exists in the selected list
    const existingItem = allItems.find(
      item => item.name === selectedGroceryItem.name && item.listId === activeList.id
    );

    if (existingItem) {
      // Update existing item quantity - use functional update to read latest state (handles rapid clicks)
      const itemId = existingItem.id;
      const itemLocalId = existingItem.localId;
      const baseQuantity = existingItem.quantity;

      await executeWithOptimisticUpdate(
        async () => {
          // Read current state to get latest quantity (handles rapid clicks)
          const currentItems = allItems;
          const currentItem = currentItems.find(
            item => item.id === itemId || item.localId === itemLocalId
          );
          const currentQuantity = currentItem?.quantity ?? baseQuantity;
          const nextQuantity = currentQuantity + quantity;

          return await updateItem(itemId, { quantity: nextQuantity });
        },
        () => {
          // Optimistic update for all modes - read latest state using functional update
          setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
            if (item.id === itemId || item.localId === itemLocalId) {
              const currentQuantity = item.quantity;
              return { ...item, quantity: currentQuantity + quantity };
            }
            return item;
          }));
        },
        () => {
          // Revert - restore previous quantity
          setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
            if (item.id === itemId || item.localId === itemLocalId) {
              return { ...item, quantity: baseQuantity };
            }
            return item;
          }));
        },
        'Failed to update shopping item quantity:'
      );
    } else {
      // Create new item with optimistic UI update
      const tempItem = createShoppingItem(selectedGroceryItem, activeList.id, quantity);
      setAllItems((prev: ShoppingItem[]) => [...prev, tempItem]);

      try {
        // Use selected category for custom items, otherwise use item's category
        const categoryToUse = selectedGroceryItem.id.startsWith('custom-')
          ? normalizeCategoryKey(selectedItemCategory)
          : selectedGroceryItem.category;

        const newItem = await createItem({
          name: selectedGroceryItem.name,
          listId: activeList.id,
          quantity,
          category: categoryToUse,
          image: selectedGroceryItem.image,
          catalogItemId: selectedGroceryItem.id.startsWith('custom-') ? undefined : selectedGroceryItem.id,
        } as any); // Type assertion needed because ShoppingItem doesn't have catalogItemId

        // Replace temp item with real item from service
        setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
          item.localId === tempItem.localId ? newItem : item
        ));
      } catch (error) {
        // Remove temp item on error
        setAllItems((prev: ShoppingItem[]) => prev.filter((item) => item.localId !== tempItem.localId));
        logShoppingError('Failed to create shopping item:', error);
      }
    }

    // Reset and close
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setQuantityInput('1');
  };

  const handleCancelQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setQuantityInput('1');
    setSelectedItemCategory(DEFAULT_CATEGORY.toLowerCase());
  };

  const handleQuantityInputChange = (delta: number) => {
    const current = parseInt(quantityInput, 10) || 0;
    const newValue = Math.max(1, current + delta);
    setQuantityInput(newValue.toString());
  };

  const handleOpenCreateListModal = () => {
    setEditingList(null);
    setShowCreateListModal(true);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor('#10B981');
  };

  const handleOpenEditListModal = (list: ShoppingList) => {
    setEditingList(list);
    setShowCreateListModal(true);
    setNewListName(list.name);
    setNewListIcon(list.icon);
    setNewListColor(list.color);
  };

  const handleCancelCreateListModal = () => {
    setShowCreateListModal(false);
    setEditingList(null);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor('#10B981');
  };

  const handleCreateList = async () => {
    const trimmedName = newListName.trim();
    if (!trimmedName) {
      return;
    }

    // Use service directly
    try {
      if (editingList) {
        await updateList(editingList.id, {
          name: trimmedName,
          icon: newListIcon,
          color: newListColor,
        });
      } else {
        const newList = await createList({
          name: trimmedName,
          icon: newListIcon,
          color: newListColor,
        });
        setSelectedList(newList);
      }
      handleCancelCreateListModal();
    } catch (error) {
      logShoppingError('Failed to save shopping list:', error);
    }
  };

  const confirmDeleteList = (list: ShoppingList) => {
    if (list.isMain) {
      return;
    }

    setPendingDeleteList(list);
  };

  const handleConfirmDeleteList = async () => {
    if (!pendingDeleteList) {
      return;
    }

    try {
      await deleteList(pendingDeleteList.id);
      setPendingDeleteList(null);
    } catch (error) {
      logShoppingError('Failed to delete shopping list:', error);
    }
  };

  const handleCategoryClick = async (categoryName: string) => {
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
        setCategoryItemsError('Failed to load category items. Please try again.');
      }
    } finally {
      if (categoryRequestIdRef.current === requestId) {
        setIsCategoryItemsLoading(false);
      }
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory('');
    setCategoryItems([]);
    setCategoryItemsError(null);
    setIsCategoryItemsLoading(false);
  };

  const handleSelectItemFromCategory = (groceryItem: GroceryItem) => {
    setShowCategoryModal(false);
    handleSelectGroceryItem(groceryItem);
  };

  // Format shopping list for sharing
  const shareText = useMemo(
    () => formatShoppingListText(activeList.name, filteredItems),
    [activeList.name, filteredItems]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Shopping List"
        titleIcon="basket-outline"
        rightActions={{
          share: { onPress: () => setShowShareModal(true), label: 'Share shopping list' },
          add: { onPress: () => setShowQuickAddModal(true), label: 'Add item' },
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
        selectedItemCategory={selectedItemCategory}
        onSelectCategory={setSelectedItemCategory}
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
        title="Quick Add"
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
                accessibilityLabel={`Switch to ${list.name}`}
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
        title={`Share ${activeList.name}`}
        shareText={shareText}
      />

      <ConfirmationModal
        visible={!!pendingDeleteList}
        title="Delete List"
        message={
          pendingDeleteList
            ? `Delete "${pendingDeleteList.name}"?`
            : ''
        }
        confirmText="Delete"
        onConfirm={handleConfirmDeleteList}
        onCancel={() => setPendingDeleteList(null)}
      />

    </SafeAreaView>
  );
}
