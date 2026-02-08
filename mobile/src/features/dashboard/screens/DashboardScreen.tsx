import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { formatTimeForDisplay, formatDateForDisplay } from '../../../common/utils/dateTimeUtils';
import { getDirectionalIcon } from '../../../common/utils/rtlIcons';
import { useDebouncedRemoteSearch, useResponsive } from '../../../common/hooks';
import { useCatalog } from '../../../common/hooks/useCatalog';
import { colors } from '../../../theme';
import { SafeImage } from '../../../common/components/SafeImage';
import { Toast } from '../../../common/components/Toast';
import { GrocerySearchBar } from '../../shopping/components/GrocerySearchBar';
import type { GroceryItem } from '../../shopping/components/GrocerySearchBar';
import type { ShoppingItem } from '../../../mocks/shopping';
import { useDashboardChores } from '../hooks/useDashboardChores';
import { useRecipes } from '../../recipes/hooks/useRecipes';
import { createShoppingService } from '../../shopping/services/shoppingService';
import { getActiveListId, getMainList } from '../../shopping/utils/selectionUtils';
import { createShoppingItem } from '../../shopping/utils/shoppingFactory';
import { DEFAULT_CATEGORY, normalizeShoppingCategory } from '../../shopping/constants/categories';
import { quickAddItem } from '../../shopping/utils/quickAddUtils';
import { config } from '../../../config';
import { styles } from './styles';
import type { DashboardScreenProps } from './types';
import type { TabKey } from '../../../common/components/BottomPillNav';

const SUGGESTED_ITEMS_MAX = 8;

function getChoreRowBackground(completed: boolean): string {
  return completed ? colors.pastel.green : colors.pastel.peach;
}

function getAvatarUri(assignee?: string): string {
  const seed = assignee ?? 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function DashboardScreen({
  onOpenShoppingModal,
  onOpenChoresModal,
  onNavigateToTab,
}: DashboardScreenProps) {
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const [searchValue, setSearchValue] = useState('');
  const shoppingButtonRef = useRef<View>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const { groceryItems, frequentlyAddedItems, searchGroceries } = useCatalog();
  const { results: searchResults } = useDebouncedRemoteSearch<GroceryItem>({
    query: searchValue,
    searchFn: searchGroceries,
    onError: (error) => {
      console.error('Search failed:', error);
    },
  });

  const suggestedItems =
    frequentlyAddedItems.length > 0
      ? frequentlyAddedItems.slice(0, SUGGESTED_ITEMS_MAX)
      : groceryItems.slice(0, SUGGESTED_ITEMS_MAX);
  const {
    todayChores,
    toggleChore,
    refresh: refreshChores,
    isLoading: choresLoading,
  } = useDashboardChores();

  const shouldUseMockData = config.mockData.enabled || !user || user?.isGuest === true;
  const shoppingService = useMemo(
    () => createShoppingService(shouldUseMockData ? 'guest' : 'signed-in'),
    [shouldUseMockData]
  );
  const { recipes, refresh: refreshRecipes } = useRecipes();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [shoppingListsCount, setShoppingListsCount] = useState(0);
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadShoppingData = useCallback(async () => {
    try {
      const data = await shoppingService.getShoppingData();
      setActiveListId((current) => getActiveListId(data.shoppingLists, current));
      setShoppingListsCount(data.shoppingLists.length);
      setAllItems(data.shoppingItems);
    } catch (_err) {
      setActiveListId(null);
      setShoppingListsCount(0);
      setAllItems([]);
    }
  }, [shoppingService]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        loadShoppingData(),
        refreshRecipes(),
        refreshChores(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadShoppingData, refreshRecipes, refreshChores]);

  useEffect(() => {
    loadShoppingData();
  }, [loadShoppingData]);

  useFocusEffect(
    useCallback(() => {
      loadShoppingData();
    }, [loadShoppingData])
  );

  const quickStats = useMemo(
    () => [
      {
        icon: 'basket-outline' as const,
        label: 'Shopping Lists',
        value: shoppingListsCount === 1 ? '1 Active' : `${shoppingListsCount} Active`,
        route: 'Shopping' as TabKey,
        iconBgStyle: 'shopping' as const,
      },
      {
        icon: 'book-outline' as const,
        label: 'Saved Recipes',
        value: recipes.length === 1 ? '1 Item' : `${recipes.length} Items`,
        route: 'Recipes' as TabKey,
        iconBgStyle: 'recipes' as const,
      },
    ],
    [shoppingListsCount, recipes.length]
  );

  const displayName = user?.name ?? 'Guest';
  const userRole = user?.isGuest ? 'Guest' : 'KITCHEN LEAD';

  // Live clock and date; timer respects mount state to avoid updates when unmounted
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, []);

  const formattedTime = formatTimeForDisplay(currentTime);
  const formattedDate = formatDateForDisplay(currentTime);

  /** Opens the quick-add shopping modal, measuring the trigger button position for animation when ref is attached. */
  const openShoppingModal = () => {
    if (shoppingButtonRef.current) {
      shoppingButtonRef.current.measureInWindow((x, y, width, height) => {
        onOpenShoppingModal({ x, y, width, height });
      });
    } else {
      onOpenShoppingModal();
    }
  };

  const handleAddToShopping = () => {
    setSearchValue('');
    openShoppingModal();
  };

  const handleSelectGroceryItem = async (item: GroceryItem) => {
    try {
      const data = await shoppingService.getShoppingData();
      const mainList = getMainList(data.shoppingLists);

      if (!mainList) {
        showToast('No main shopping list found. Please create one.');
        return;
      }

      // Use the same pattern as ShoppingListsScreen but always use main list
      const normalizedItemName = item.name.trim().toLowerCase();
      const existingInList = data.shoppingItems.find(
        (i) => i.listId === mainList.id && i.name.trim().toLowerCase() === normalizedItemName
      );

      if (existingInList) {
        const currentQuantity = typeof existingInList.quantity === 'number' ? existingInList.quantity : 0;
        await shoppingService.updateItem(existingInList.id, {
          quantity: currentQuantity + 1,
        });
        showToast(`${item.name} quantity updated`);
      } else {
        // Use default category for custom items, otherwise use item's category
        const categoryToUse = item.id.startsWith('custom-')
          ? normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase())
          : item.category;

        const newItemData: Partial<ShoppingItem> = {
          listId: mainList.id,
          name: item.name.trim(),
          quantity: 1,
          category: categoryToUse,
          image: item.image ?? '',
          catalogItemId: item.id.startsWith('custom-') ? undefined : item.id,
        } as any; // Type assertion needed because ShoppingItem doesn't have catalogItemId

        await shoppingService.createItem(newItemData);
        showToast(`${item.name} added to ${mainList.name}`);
      }
      // Don't clear search value - keep dropdown open for multiple additions
    } catch (error) {
      console.error('Failed to add item to shopping list:', error);
      showToast('Failed to add item');
    }
  };

  // Helper functions for quick add utility
  type ShoppingItemWithCatalog = Partial<ShoppingItem> & {
    catalogItemId?: string;
    masterItemId?: string;
  };

  const createItem = async (item: ShoppingItemWithCatalog) => {
    return await shoppingService.createItem(item);
  };

  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    return await shoppingService.updateItem(itemId, updates);
  };

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
      console.error(errorMessage, error);
      return null;
    }
  };

  const logShoppingError = (message: string, error: unknown) => {
    console.error(message, error);
    showToast('Failed to add item');
  };

  const handleQuickAddGroceryItem = async (item: GroceryItem) => {
    try {
      const data = await shoppingService.getShoppingData();
      const mainList = getMainList(data.shoppingLists);

      if (!mainList) {
        showToast('No main shopping list found. Please create one.');
        return;
      }

      // Refresh allItems from latest data before quick add
      setAllItems(data.shoppingItems);

      await quickAddItem(item, mainList, {
        allItems: data.shoppingItems,
        setAllItems,
        createItem,
        updateItem,
        executeWithOptimisticUpdate,
        logShoppingError,
      });

      // Refresh data after quick add to sync with server
      const updatedData = await shoppingService.getShoppingData();
      setAllItems(updatedData.shoppingItems);
    } catch (error) {
      console.error('Failed to add item to shopping list:', error);
      showToast('Failed to add item');
    }
  };

  /**
   * Adds a suggested grocery item to the shopping list.
   * If the item already exists in the list, increments its quantity by 1.
   * Otherwise creates a new item with quantity 1.
   * Opens the shopping modal if there is no active list, or if the operation fails.
   *
   * @param item - The grocery item to add
   */
  /**
   * Handles adding a suggested grocery item to the shopping list.
   * If the item already exists, increments its quantity by 1.
   * Otherwise creates a new item with quantity 1.
   * Opens the shopping modal only if there's no active list or if the operation fails due to missing list.
   * 
   * @param item - The grocery item to add
   */
  const handleSuggestionPress = async (item: GroceryItem) => {
    if (!activeListId) {
      openShoppingModal();
      return;
    }
    const addQuantity = 1;
    try {
      const data = await shoppingService.getShoppingData();
      const normalizedItemName = item.name.trim().toLowerCase();
      const existingInList = data.shoppingItems.find(
        (i) => i.listId === activeListId && i.name.trim().toLowerCase() === normalizedItemName
      );
      if (existingInList) {
        const currentQuantity = typeof existingInList.quantity === 'number' ? existingInList.quantity : 0;
        await shoppingService.updateItem(existingInList.id, {
          quantity: currentQuantity + addQuantity,
        });
        showToast(`${item.name} quantity updated`);
      } else {
        const newItemData: Partial<ShoppingItem> = {
          listId: activeListId,
          name: item.name.trim(),
          quantity: 1,
          category: item.category ?? 'Other',
          image: item.image ?? '',
        };
        await shoppingService.createItem(newItemData);
        showToast(`${item.name} added to shopping list`);
      }
      // Refresh shopping data to update the UI immediately
      await loadShoppingData();
    } catch (error) {
      console.error('Failed to add item to shopping list:', error);
      showToast('Failed to add item');
      // Only open modal if error is related to missing list, not other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('list') || errorMessage.includes('List')) {
        openShoppingModal();
      }
    }
  };

  const handleStatPress = (route: TabKey | null) => {
    if (route) {
      onNavigateToTab(route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, !isTablet && styles.headerPhone]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="grid" size={20} color={colors.textLight} />
          </View>
          {isTablet && <Text style={styles.logoText}>Kitchen Hub</Text>}
        </View>

        <View style={styles.headerRight}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.timeText}>{formattedTime}</Text>
            {isTablet && <Text style={styles.dateText}>{formattedDate}</Text>}
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <View style={styles.profileSectionSeparator} />

          <View style={styles.profileSection}>
            {isTablet && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileRole}>{userRole}</Text>
                <Text style={styles.profileName}>{displayName}</Text>
              </View>
            )}
            <View style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <SafeImage uri={user.avatarUrl} style={styles.avatar} />
              ) : (
                <SafeImage
                  uri={getAvatarUri(user?.name ?? 'user')}
                  style={styles.avatar}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Two-column layout */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridPhone]}>
          {/* Left column: Shopping widget + Quick stats */}
          <View style={[styles.leftColumn, !isTablet && styles.fullWidthColumn]}>
            <View style={styles.leftColumnContent}>
              {/* Add to Shopping List card */}
              <View style={styles.shoppingCard}>
                <View style={styles.shoppingCardHeader}>
                  <View style={styles.shoppingCardTitleBlock}>
                    <Text style={styles.shoppingCardTitle}>Add to Shopping List</Text>
                    <Text style={styles.shoppingCardSubtitle}>
                      Running low on something? Put it down now.
                    </Text>
                  </View>
                  <View style={styles.mainListBadge}>
                    <Text style={styles.mainListBadgeText}>Main List</Text>
                  </View>
                </View>

                <View style={styles.inputRowWithDropdown}>
                  <View style={styles.grocerySearchBarWrapper}>
                    <GrocerySearchBar
                      items={searchValue ? searchResults : []}
                      value={searchValue}
                      onChangeText={setSearchValue}
                      onSelectItem={handleSelectGroceryItem}
                      onQuickAddItem={handleQuickAddGroceryItem}
                      variant="background"
                      showShadow={false}
                      allowCustomItems={true}
                      searchMode="remote"
                      containerStyle={styles.grocerySearchBarContainer}
                    />
                  </View>
                  <TouchableOpacity style={styles.micButton}>
                    <Ionicons name="mic-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.suggestedSection}>
                  <Text style={styles.suggestedLabel}>Suggested Items</Text>
                  <View style={styles.suggestionChipsRow}>
                    {suggestedItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.suggestionChip}
                        onPress={() => handleSuggestionPress(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={14} color={colors.textSecondary} />
                        <Text style={styles.suggestionChipText}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Quick stats */}
              <View style={styles.quickStatsRow}>
                {quickStats.map((stat) => (
                  <TouchableOpacity
                    key={stat.label}
                    style={styles.quickStatCard}
                    onPress={() => handleStatPress(stat.route)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.quickStatIconContainer,
                        stat.iconBgStyle === 'shopping' && styles.quickStatIconShopping,
                        stat.iconBgStyle === 'recipes' && styles.quickStatIconRecipes,
                      ]}
                    >
                      <Ionicons
                        name={stat.icon}
                        size={20}
                        color={
                          stat.iconBgStyle === 'shopping'
                            ? colors.primary
                            : colors.secondary
                        }
                      />
                    </View>
                    <Text style={styles.quickStatLabel}>{stat.label}</Text>
                    <View style={styles.quickStatValueRow}>
                      <Text style={styles.quickStatValue}>{stat.value}</Text>
                      <Ionicons name={getDirectionalIcon('chevron-forward')} size={16} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Right column: Important Chores */}
          <View style={[styles.rightColumn, !isTablet && styles.fullWidthColumn]}>
            <View style={styles.choresCard}>
              <View style={styles.choresSectionHeader}>
                <View style={styles.choresTitleBlock}>
                  <Text style={styles.choresSectionTitle}>Important Chores</Text>
                  <Text style={styles.choresSectionSubtitle}>
                    Assignments for the house
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onNavigateToTab('Chores')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.choreList}>
                {!choresLoading &&
                  todayChores.map((chore) => (
                    <TouchableOpacity
                      key={chore.id}
                      style={[
                        styles.choreRow,
                        chore.isCompleted && styles.choreRowDone,
                        { backgroundColor: getChoreRowBackground(chore.isCompleted) },
                      ]}
                      onPress={() => toggleChore(chore.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.choreAvatarContainer}>
                        <SafeImage
                          uri={getAvatarUri(chore.assignee)}
                          style={styles.choreAvatar}
                        />
                      </View>
                      <View style={styles.choreContent}>
                        <View style={styles.choreTitleRow}>
                          <Text
                            style={[
                              styles.choreTitle,
                              chore.isCompleted && styles.choreTitleDone,
                            ]}
                            numberOfLines={1}
                          >
                            {chore.title}
                          </Text>
                          <View
                            style={[
                              styles.choreStatusBadge,
                              chore.isCompleted
                                ? styles.choreStatusDone
                                : styles.choreStatusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.choreStatusBadgeText,
                                chore.isCompleted && styles.choreStatusBadgeTextDone,
                              ]}
                            >
                              {chore.isCompleted ? 'Done' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.choreMetaRow}>
                          <Text style={styles.choreMetaText}>
                            {chore.assignee ?? 'Unassigned'}
                          </Text>
                          <View style={styles.choreMetaDot} />
                          <Text style={styles.choreMetaText}>
                            {chore.dueDate}
                            {chore.dueTime ? ` · ${chore.dueTime}` : ''}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>

              <TouchableOpacity
                style={styles.addHouseholdTaskButton}
                onPress={onOpenChoresModal}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={colors.textMuted} />
                <Text style={styles.addHouseholdTaskText}>Add Household Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}
