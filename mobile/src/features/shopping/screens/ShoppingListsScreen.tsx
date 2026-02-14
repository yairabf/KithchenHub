import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { CategoryModal } from '../components/CategoryModal';
import { ShoppingListPanel } from '../components/ShoppingListPanel';
import { CategoriesGrid } from '../components/CategoriesGrid';
import { FrequentlyAddedGrid } from '../components/FrequentlyAddedGrid';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ShareModal } from '../../../common/components/ShareModal';
import { formatShoppingListText } from '../../../common/utils/shareUtils';
import { GrocerySearchBar, GroceryItem } from '../components/GrocerySearchBar';
import { CategoryPicker } from '../components/CategoryPicker';
import { catalogService } from '../../../common/services/catalogService';
import { DEFAULT_CATEGORY, normalizeShoppingCategory } from '../constants/categories';
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

type IoniconsName = ComponentProps<typeof Ionicons>['name'];



interface ShoppingListsScreenProps {
  isActive?: boolean;
}

export function ShoppingListsScreen(props: ShoppingListsScreenProps = {}) {
  const { isActive = true } = props;
  const { isTablet } = useResponsive();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { groceryItems, categories: rawCategories, frequentlyAddedItems, searchGroceries } = useCatalog();

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

  // Load categories for custom item selection
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ShoppingListsScreen.tsx:65', message: 'Calling getShoppingCategories', data: { methodExists: typeof catalogService.getShoppingCategories === 'function' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
    catalogService.getShoppingCategories()
      .then((cats) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ShoppingListsScreen.tsx:67', message: 'getShoppingCategories resolved', data: { categoryCount: cats?.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        setAvailableCategories(cats);
        // Set default category if not in list
        if (cats.length > 0 && !cats.includes(selectedItemCategory)) {
          setSelectedItemCategory(normalizeShoppingCategory(cats[0]));
        }
      })
      .catch((error) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ShoppingListsScreen.tsx:catch', message: 'getShoppingCategories error', data: { errorMessage: error?.message, errorName: error?.name, errorType: typeof error }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        console.error('Failed to load categories:', error);
      });
  }, []);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState<IoniconsName>('cart-outline');
  const [newListColor, setNewListColor] = useState('#10B981');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          ? normalizeShoppingCategory(selectedItemCategory)
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
    setShowCreateListModal(true);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor('#10B981');
  };

  const handleCancelCreateListModal = () => {
    setShowCreateListModal(false);
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
      const newList = await createList({
        name: trimmedName,
        icon: newListIcon,
        color: newListColor,
      });

      setSelectedList(newList);
      handleCancelCreateListModal();
    } catch (error) {
      logShoppingError('Failed to create shopping list:', error);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory('');
  };

  const handleSelectItemFromCategory = (groceryItem: GroceryItem) => {
    setShowCategoryModal(false);
    handleSelectGroceryItem(groceryItem);
  };

  const getCategoryItems = (categoryName: string): GroceryItem[] => {
    return groceryItems.filter(item => item.category === categoryName);
  };

  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

  // Format shopping list for sharing
  const shareText = useMemo(
    () => formatShoppingListText(activeList.name, filteredItems),
    [activeList.name, filteredItems]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>Household Hub</Text>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <View style={styles.headerMeta}>
            <Ionicons name="basket-outline" size={18} color={colors.textMuted} />
            <Text style={styles.headerMetaText}>{totalItems} items remaining</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityLabel="Share shopping list"
            style={styles.headerIconButton}
            onPress={() => setShowShareModal(true)}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Add item to list"
            style={styles.headerPrimaryButton}
            onPress={() => setShowQuickAddModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.textLight} />
            <Text style={styles.headerPrimaryButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            onSelectGroceryItem={handleSelectGroceryItem}
            onQuickAddItem={handleQuickAddItem}
            onQuantityChange={handleQuantityChange}
            onDeleteItem={handleDeleteItem}
            onToggleItemChecked={handleToggleItemChecked}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchMode="remote"
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

      {/* Quantity Modal */}
      <CenteredModal
        visible={showQuantityModal}
        onClose={handleCancelQuantityModal}
        title={`Add to ${activeList.name}`}
        confirmText="Add to List"
        onConfirm={handleAddToList}
        confirmColor={activeList.color}
      >
        {selectedGroceryItem && (
          <>
            <View style={styles.modalItemDisplay}>
              <Image
                source={{ uri: selectedGroceryItem.image }}
                style={styles.modalItemImage}
              />
              <View style={styles.modalItemInfo}>
                <Text style={styles.modalItemName}>{selectedGroceryItem.name}</Text>
                <Text style={styles.modalItemCategory}>{selectedGroceryItem.category}</Text>
              </View>
            </View>

            {/* Category Picker (only for custom items) */}
            {selectedGroceryItem.id.startsWith('custom-') && availableCategories.length > 0 && (
              <View style={styles.modalCategorySection}>
                <Text style={styles.modalQuantityLabel}>Category</Text>
                <CategoryPicker
                  selectedCategory={selectedItemCategory}
                  onSelectCategory={setSelectedItemCategory}
                  categories={availableCategories}
                />
              </View>
            )}

            <View style={styles.modalQuantitySection}>
              <Text style={styles.modalQuantityLabel}>Quantity</Text>
              <View style={styles.modalQuantityControls}>
                <TouchableOpacity
                  style={styles.modalQuantityBtn}
                  onPress={() => handleQuantityInputChange(-1)}
                >
                  <Ionicons name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.modalQuantityInput}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.modalQuantityBtn}
                  onPress={() => handleQuantityInputChange(1)}
                >
                  <Ionicons name="add" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </CenteredModal>

      {/* Create List Modal */}
      <CenteredModal
        visible={showCreateListModal}
        onClose={handleCancelCreateListModal}
        title="Create New List"
        confirmText="Create"
        onConfirm={handleCreateList}
        confirmColor={colors.chores}
        confirmDisabled={!newListName.trim()}
      >
        <View style={styles.createListInputSection}>
          <Text style={styles.createListLabel}>List Name</Text>
          <TextInput
            style={styles.createListInput}
            placeholder="Enter list name..."
            placeholderTextColor={colors.textMuted}
            value={newListName}
            onChangeText={setNewListName}
            autoFocus
          />
        </View>

        <View style={styles.createListIconSection}>
          <Text style={styles.createListLabel}>Icon</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconPickerContent}
          >
            {(['cart-outline', 'gift-outline', 'restaurant-outline', 'cube-outline', 'nutrition-outline', 'heart-outline', 'home-outline', 'star-outline'] as const).map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  newListIcon === icon && styles.iconOptionActive
                ]}
                onPress={() => setNewListIcon(icon)}
              >
                <Ionicons name={icon} size={24} color={newListIcon === icon ? colors.chores : colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.createListColorSection}>
          <Text style={styles.createListLabel}>Color</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPickerContent}
          >
            {['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#F97316', '#14B8A6'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  newListColor === color && styles.colorOptionActive
                ]}
                onPress={() => setNewListColor(color)}
              >
                {newListColor === color && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </CenteredModal>

      {/* Category Modal */}
      <CategoryModal
        visible={showCategoryModal}
        categoryName={selectedCategory}
        items={getCategoryItems(selectedCategory)}
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

    </SafeAreaView>
  );
}
