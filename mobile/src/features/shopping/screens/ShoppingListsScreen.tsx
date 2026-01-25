import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { CategoryModal } from '../components/CategoryModal';
import { AllItemsModal } from '../components/AllItemsModal';
import { ShoppingListPanel } from '../components/ShoppingListPanel';
import { CategoriesGrid } from '../components/CategoriesGrid';
import { FrequentlyAddedGrid } from '../components/FrequentlyAddedGrid';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { ShareModal } from '../../../common/components/ShareModal';
import { formatShoppingListText } from '../../../common/utils/shareUtils';
import { GrocerySearchBar, GroceryItem } from '../components/GrocerySearchBar';
import { useResponsive } from '../../../common/hooks';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { ShoppingItem, ShoppingList, Category } from '../../../mocks/shopping';
import { createShoppingItem, createShoppingList } from '../utils/shoppingFactory';
import { createShoppingService } from '../services/shoppingService';
import { config } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';
import { getSelectedList } from '../utils/selectionUtils';
import { determineUserDataMode } from '../../../common/types/dataModes';
import { supabase } from '../../../services/supabase';
import { api } from '../../../services/api';
import {
  applyShoppingItemChange,
  applyShoppingListChange,
  buildListIdFilter,
  updateShoppingListItemCounts,
} from '../utils/shoppingRealtime';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

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


export function ShoppingListsScreen() {
  const { isTablet } = useResponsive();
  const { user } = useAuth();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frequentlyAddedItems, setFrequentlyAddedItems] = useState<GroceryItem[]>([]);
  const [selectedGroceryItem, setSelectedGroceryItem] = useState<GroceryItem | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState<IoniconsName>('cart-outline');
  const [newListColor, setNewListColor] = useState('#10B981');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAllItemsModal, setShowAllItemsModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // Determine data mode based on user authentication state
  const userMode = useMemo(() => {
    if (config.mockData.enabled) {
      return 'guest' as const;
    }
    return determineUserDataMode(user);
  }, [user]);

  const isRealtimeEnabled = userMode === 'signed-in' && !!user?.householdId;
  const listIdFilter = buildListIdFilter(shoppingLists.map((list) => list.id));
  const shoppingService = useMemo(
    () => createShoppingService(userMode),
    [userMode]
  );
  const fallbackList = useMemo<ShoppingList>(() => ({
    id: 'fallback-list',
    localId: 'fallback-list',
    name: 'My List',
    itemCount: 0,
    icon: 'cart-outline',
    color: colors.shopping,
  }), []);
  const activeList = selectedList ?? shoppingLists[0] ?? fallbackList;

  useEffect(() => {
    let isMounted = true;

    const loadShoppingData = async () => {
      try {
        const data = await shoppingService.getShoppingData();
        if (!isMounted) {
          return;
        }

        setShoppingLists(data.shoppingLists);
        setAllItems(data.shoppingItems);
        setGroceryItems(data.groceryItems);
        setCategories(data.categories);
        setFrequentlyAddedItems(data.frequentlyAddedItems);
        setSelectedList((current) => getSelectedList(data.shoppingLists, current?.id));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load shopping data:', error);
      }
    };

    loadShoppingData();

    return () => {
      isMounted = false;
    };
  }, [shoppingService]);

  useEffect(() => {
    setShoppingLists((currentLists) =>
      updateShoppingListItemCounts(currentLists, allItems),
    );
  }, [allItems]);

  useEffect(() => {
    setSelectedList((currentSelected) => getSelectedList(shoppingLists, currentSelected?.id));
  }, [shoppingLists]);

  useEffect(() => {
    if (!isRealtimeEnabled || !user?.householdId) {
      return;
    }

    const channel = supabase.channel(`shopping-lists-${user.householdId}`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shopping_lists',
        filter: `household_id=eq.${user.householdId}`,
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<ShoppingListRealtimeRow>;

        setShoppingLists((currentLists) => {
          const nextLists = applyShoppingListChange(currentLists, typedPayload);
          setSelectedList((currentSelected) =>
            getSelectedList(nextLists, currentSelected?.id),
          );
          return nextLists;
        });

        if (typedPayload.eventType === 'DELETE') {
          const deletedId = typedPayload.old?.id;
          if (deletedId) {
            setAllItems((currentItems) =>
              currentItems.filter((item) => item.listId !== deletedId),
            );
          }
        }
      },
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [isRealtimeEnabled, user?.householdId]);

  useEffect(() => {
    if (!isRealtimeEnabled || !user?.householdId || !listIdFilter) {
      return;
    }

    const channel = supabase.channel(`shopping-items-${user.householdId}`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: listIdFilter,
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<ShoppingItemRealtimeRow>;
        setAllItems((currentItems) =>
          applyShoppingItemChange(currentItems, typedPayload, groceryItems),
        );
      },
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [groceryItems, isRealtimeEnabled, listIdFilter, user?.householdId]);

  // Filter items based on selected list
  const filteredItems = allItems.filter(item => item.listId === activeList.id);

  const logShoppingError = (message: string, error: unknown) => {
    console.error(message, error);
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
   *   () => shoppingService.toggleItem(itemId),
   *   () => setAllItems(prev => prev.map(item => 
   *     item.id === itemId ? {...item, isChecked: true} : item
   *   )),
   *   () => setAllItems(prev => prev.map(item => 
   *     item.id === itemId ? {...item, isChecked: false} : item
   *   )),
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
      () => shoppingService.updateItem(itemId, { quantity: nextQuantity }),
      () => {
        setAllItems((prev) => prev.map((item) =>
          item.id === itemId || item.localId === itemId
            ? { ...item, quantity: nextQuantity }
            : item,
        ));
      },
      () => {
        setAllItems((prev) => prev.map((item) =>
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
      () => shoppingService.deleteItem(itemId),
      () => {
        setAllItems((prev) => prev.filter((item) => item.id !== itemId && item.localId !== itemId));
      },
      () => {
        setAllItems((prev) => [...prev, targetItem]);
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
      () => shoppingService.toggleItem(itemId),
      () => {
        setAllItems((prev) => prev.map((item) =>
          item.id === itemId || item.localId === itemId
            ? { ...item, isChecked: nextChecked }
            : item,
        ));
      },
      () => {
        setAllItems((prev) => prev.map((item) =>
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
    setQuantityInput(groceryItem.defaultQuantity.toString());
    setShowQuantityModal(true);
    // Keep dropdown open so user can continue adding items after modal closes
  };

  const handleQuickAddItem = async (groceryItem: GroceryItem) => {
    const quantity = groceryItem.defaultQuantity;

    // Check if item already exists in the selected list
    const existingItem = allItems.find(
      item => item.name === groceryItem.name && item.listId === activeList.id
    );

    if (existingItem) {
      // Update existing item quantity
      const previousQuantity = existingItem.quantity;
      const nextQuantity = previousQuantity + quantity;

      await executeWithOptimisticUpdate(
        () => shoppingService.updateItem(existingItem.id, { quantity: nextQuantity }),
        () => {
          setAllItems((prev) => prev.map((item) =>
            item.id === existingItem.id || item.localId === existingItem.localId
              ? { ...item, quantity: nextQuantity }
              : item,
          ));
        },
        () => {
          setAllItems((prev) => prev.map((item) =>
            item.id === existingItem.id || item.localId === existingItem.localId
              ? { ...item, quantity: previousQuantity }
              : item,
          ));
        },
        'Failed to update shopping item quantity:'
      );
    } else {
      // Create new item with optimistic UI update
      const tempItem = createShoppingItem(groceryItem, activeList.id, quantity);
      setAllItems((prev) => [...prev, tempItem]);

      try {
        const newItem = await shoppingService.createItem({
          name: groceryItem.name,
          listId: activeList.id,
          quantity,
          category: groceryItem.category,
          image: groceryItem.image,
        });
        
        // Replace temp item with real item from service
        setAllItems((prev) => prev.map((item) =>
          item.localId === tempItem.localId ? newItem : item
        ));
      } catch (error) {
        // Remove temp item on error
        setAllItems((prev) => prev.filter((item) => item.localId !== tempItem.localId));
        logShoppingError('Failed to create shopping item:', error);
      }
    }

    // Keep dropdown open and search query intact for rapid multi-item addition
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
      // Update existing item quantity
      const previousQuantity = existingItem.quantity;
      const nextQuantity = previousQuantity + quantity;

      await executeWithOptimisticUpdate(
        () => shoppingService.updateItem(existingItem.id, { quantity: nextQuantity }),
        () => {
          setAllItems((prev) => prev.map((item) =>
            item.id === existingItem.id || item.localId === existingItem.localId
              ? { ...item, quantity: nextQuantity }
              : item,
          ));
        },
        () => {
          setAllItems((prev) => prev.map((item) =>
            item.id === existingItem.id || item.localId === existingItem.localId
              ? { ...item, quantity: previousQuantity }
              : item,
          ));
        },
        'Failed to update shopping item quantity:'
      );
    } else {
      // Create new item with optimistic UI update
      const tempItem = createShoppingItem(selectedGroceryItem, activeList.id, quantity);
      setAllItems((prev) => [...prev, tempItem]);

      try {
        const newItem = await shoppingService.createItem({
          name: selectedGroceryItem.name,
          listId: activeList.id,
          quantity,
          category: selectedGroceryItem.category,
          image: selectedGroceryItem.image,
        });
        
        // Replace temp item with real item from service
        setAllItems((prev) => prev.map((item) =>
          item.localId === tempItem.localId ? newItem : item
        ));
      } catch (error) {
        // Remove temp item on error
        setAllItems((prev) => prev.filter((item) => item.localId !== tempItem.localId));
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

    // Always call service method (service handles guest vs signed-in internally)
    try {
      const newList = await shoppingService.createList({
        name: trimmedName,
        icon: newListIcon,
        color: newListColor,
      });
      setShoppingLists((prev) => [...prev, newList]);
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

  const handleOpenAllItemsModal = () => {
    setShowAllItemsModal(true);
  };

  const handleCloseAllItemsModal = () => {
    setShowAllItemsModal(false);
  };

  const handleSelectItemFromAllItems = (groceryItem: GroceryItem) => {
    setShowAllItemsModal(false);
    handleSelectGroceryItem(groceryItem);
  };

  const handleQuickAddItemFromAllItems = (groceryItem: GroceryItem) => {
    // Don't close modal - keep it open for rapid adding
    handleQuickAddItem(groceryItem);
  };

  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

  // Format shopping list for sharing
  const shareText = useMemo(
    () => formatShoppingListText(activeList.name, filteredItems),
    [activeList.name, filteredItems]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={activeList.name}
        subtitle={`${totalItems} items total`}
        rightActions={{
          share: { onPress: () => setShowShareModal(true), label: 'Share shopping list' },
          add: { onPress: () => setShowQuickAddModal(true), label: 'Add item to list' },
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.mainGrid, !isTablet && styles.mainGridPhone]}>
          {/* Left Column - Shopping List */}
          <ShoppingListPanel
            shoppingLists={shoppingLists}
            selectedList={activeList}
            filteredItems={filteredItems}
            groceryItems={groceryItems}
            onSelectList={(list) => setSelectedList(list)}
            onCreateList={handleOpenCreateListModal}
            onSelectGroceryItem={handleSelectGroceryItem}
            onQuickAddItem={handleQuickAddItem}
            onQuantityChange={handleQuantityChange}
            onDeleteItem={handleDeleteItem}
            onToggleItemChecked={handleToggleItemChecked}
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
              onSeeAllPress={handleOpenAllItemsModal}
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

      {/* All Items Modal */}
      <AllItemsModal
        visible={showAllItemsModal}
        items={groceryItems}
        onClose={handleCloseAllItemsModal}
        onSelectItem={handleSelectItemFromAllItems}
        onQuickAddItem={handleQuickAddItemFromAllItems}
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
