import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../contexts/AuthContext";
import {
  formatTimeForDisplay,
  formatDateForDisplay,
} from "../../../common/utils/dateTimeUtils";
import { getDirectionalIcon } from "../../../common/utils/rtlIcons";
import { formatChoreDueDateTime } from "../../../common/utils/choreDisplayUtils";
import { useDebouncedRemoteSearch, useResponsive } from "../../../common/hooks";
import { useCatalog } from "../../../common/hooks/useCatalog";
import { colors } from "../../../theme";
import { SafeImage } from "../../../common/components/SafeImage";
import { Toast } from "../../../common/components/Toast";
import { ListItemSkeleton } from "../../../common/components/ListItemSkeleton";
import { ScreenHeader } from "../../../common/components/ScreenHeader";
import { GrocerySearchBar } from "../../shopping/components/GrocerySearchBar";
import type { GroceryItem } from "../../shopping/components/GrocerySearchBar";
import type { ShoppingItem } from "../../../mocks/shopping";
import { useDashboardChores } from "../hooks/useDashboardChores";
import { useRecipes } from "../../recipes/hooks/useRecipes";
import { createShoppingService } from "../../shopping/services/shoppingService";
import {
  getActiveListId,
  getMainList,
} from "../../shopping/utils/selectionUtils";
import { createShoppingItem } from "../../shopping/utils/shoppingFactory";
import {
  DEFAULT_CATEGORY,
  normalizeShoppingCategory,
} from "../../shopping/constants/categories";
import { quickAddItem } from "../../shopping/utils/quickAddUtils";
import { config } from "../../../config";
import { styles } from "./styles";
import type { DashboardScreenProps } from "./types";
import type { TabKey } from "../../../common/components/BottomPillNav";

const SUGGESTED_ITEMS_MAX = 8;

function getChoreRowBackground(completed: boolean): string {
  return completed ? colors.pastel.green : colors.pastel.peach;
}

function getAvatarUri(assignee?: string): string {
  const seed = assignee ?? "default";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function DashboardScreen({
  onOpenShoppingModal,
  onOpenChoresModal,
  onNavigateToTab,
}: DashboardScreenProps) {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { isTablet } = useResponsive();
  const isMobile = Platform.OS !== "web" && !isTablet;
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestedItems, setShowSuggestedItems] = useState(!isMobile);
  const shoppingButtonRef = useRef<View>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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
      console.error("Search failed:", error);
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

  const shouldUseMockData =
    config.mockData.enabled || !user || user?.isGuest === true;
  const shoppingService = useMemo(
    () => createShoppingService(shouldUseMockData ? "guest" : "signed-in"),
    [shouldUseMockData],
  );
  const { recipes, refresh: refreshRecipes } = useRecipes();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [shoppingListsCount, setShoppingListsCount] = useState(0);
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadShoppingData = useCallback(async () => {
    try {
      const data = await shoppingService.getShoppingData();
      setActiveListId((current) =>
        getActiveListId(data.shoppingLists, current),
      );
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
    }, [loadShoppingData]),
  );

  const quickStats = useMemo(
    () => [
      {
        icon: "basket-outline" as const,
        label: t('shoppingLists'),
        value: t('activeCount', { count: shoppingListsCount }),
        route: "Shopping" as TabKey,
        iconBgStyle: "shopping" as const,
      },
      {
        icon: "book-outline" as const,
        label: t('savedRecipes'),
        value: t('itemCount', { count: recipes.length }),
        route: "Recipes" as TabKey,
        iconBgStyle: "recipes" as const,
      },
    ],
    [shoppingListsCount, recipes.length, t],
  );

  const displayName = user?.name ?? t('guest');
  const userRole = user?.isGuest ? t('guest') : t('kitchenLead');

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
    setSearchValue("");
    openShoppingModal();
  };

  const handleSelectGroceryItem = async (item: GroceryItem) => {
    try {
      const data = await shoppingService.getShoppingData();
      const mainList = getMainList(data.shoppingLists);

      if (!mainList) {
        showToast(t('toast.noMainList'));
        return;
      }

      // Use the same pattern as ShoppingListsScreen but always use main list
      const normalizedItemName = item.name.trim().toLowerCase();
      const existingInList = data.shoppingItems.find(
        (i) =>
          i.listId === mainList.id &&
          i.name.trim().toLowerCase() === normalizedItemName,
      );

      if (existingInList) {
        const currentQuantity =
          typeof existingInList.quantity === "number"
            ? existingInList.quantity
            : 0;
        await shoppingService.updateItem(existingInList.id, {
          quantity: currentQuantity + 1,
        });
        showToast(t('toast.quantityUpdated', { name: item.name }));
      } else {
        // Use default category for custom items, otherwise use item's category
        const categoryToUse = item.id.startsWith("custom-")
          ? normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase())
          : item.category;

        const newItemData: Partial<ShoppingItem> = {
          listId: mainList.id,
          name: item.name.trim(),
          quantity: 1,
          category: categoryToUse,
          image: item.image ?? "",
          catalogItemId: item.id.startsWith("custom-") ? undefined : item.id,
        } as any; // Type assertion needed because ShoppingItem doesn't have catalogItemId

        await shoppingService.createItem(newItemData);
        showToast(t('toast.itemAdded', { name: item.name, listName: mainList.name }));
      }
      // Don't clear search value - keep dropdown open for multiple additions
    } catch (error) {
      console.error("Failed to add item to shopping list:", error);
      showToast(t('toast.failedToAdd'));
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
  };

  const logShoppingError = (message: string, error: unknown) => {
    console.error(message, error);
    showToast(t('toast.failedToAdd'));
  };

  const handleQuickAddGroceryItem = async (item: GroceryItem) => {
    try {
      const data = await shoppingService.getShoppingData();
      const mainList = getMainList(data.shoppingLists);

      if (!mainList) {
        showToast(t('toast.noMainList'));
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
      console.error("Failed to add item to shopping list:", error);
      showToast(t('toast.failedToAdd'));
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
        (i) =>
          i.listId === activeListId &&
          i.name.trim().toLowerCase() === normalizedItemName,
      );
      if (existingInList) {
        const currentQuantity =
          typeof existingInList.quantity === "number"
            ? existingInList.quantity
            : 0;
        await shoppingService.updateItem(existingInList.id, {
          quantity: currentQuantity + addQuantity,
        });
        showToast(t('toast.quantityUpdated', { name: item.name }));
      } else {
        const newItemData: Partial<ShoppingItem> = {
          listId: activeListId,
          name: item.name.trim(),
          quantity: 1,
          category: item.category ?? "Other",
          image: item.image ?? "",
        };
        await shoppingService.createItem(newItemData);
        showToast(t('toast.itemAdded', { name: item.name, listName: t('shoppingLists') }));
      }
      // Refresh shopping data to update the UI immediately
      await loadShoppingData();
    } catch (error) {
      console.error("Failed to add item to shopping list:", error);
      showToast(t('toast.failedToAdd'));
      // Only open modal if error is related to missing list, not other errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("list") || errorMessage.includes("List")) {
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
      <ScreenHeader
        title={t('title')}
        titleIcon="grid-outline"
        rightSlot={(
          <View style={styles.headerRight}>
            {isTablet && (
              <View style={styles.dateTimeContainer}>
                <Text style={styles.timeText}>{formattedTime}</Text>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.notificationButton}
              accessibilityLabel="Notifications - View recent activity and updates"
              accessibilityRole="button"
              accessibilityHint="Tap to open notifications"
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.textSecondary}
              />
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
                    uri={getAvatarUri(user?.name ?? "user")}
                    style={styles.avatar}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      />

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
          <View
            style={[styles.leftColumn, !isTablet && styles.fullWidthColumn]}
          >
            <View style={styles.leftColumnContent}>
              {/* Add to Shopping List card */}
              <View
                style={[
                  styles.shoppingCard,
                  isMobile && styles.shoppingCardMobile,
                ]}
              >
                <View style={styles.shoppingCardHeader}>
                  <View style={styles.shoppingCardTitleBlock}>
                    <Text style={styles.shoppingCardTitle}>{t('quickAdd.title')}</Text>
                    <Text style={styles.shoppingCardSubtitle}>
                      {t('quickAdd.subtitle')}
                    </Text>
                  </View>
                  <View style={styles.mainListBadge}>
                    <Text style={styles.mainListBadgeText}>{t('quickAdd.mainList')}</Text>
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
                      variant="surface"
                      showShadow={true}
                      allowCustomItems={true}
                      searchMode="remote"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.micButton}
                    accessibilityLabel="Voice input"
                    accessibilityRole="button"
                    accessibilityHint="Add items using voice"
                  >
                    <Ionicons
                      name="mic-outline"
                      size={22}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.suggestedSection}>
                  <View style={styles.suggestedHeader}>
                    <Text style={styles.suggestedLabel}>{t('quickAdd.suggestedItems')}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setShowSuggestedItems((current) => !current)
                      }
                      activeOpacity={0.7}
                      accessibilityLabel={
                        showSuggestedItems
                          ? "Hide suggested items"
                          : "Show suggested items"
                      }
                      accessibilityRole="button"
                      accessibilityHint="Toggles suggested shopping items"
                    >
                      <Text style={styles.suggestedToggleText}>
                        {showSuggestedItems ? t('buttons.hide', { ns: 'common' }) : t('buttons.show', { ns: 'common' })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showSuggestedItems ? (
                    <ScrollView
                      style={styles.suggestionScrollArea}
                      contentContainerStyle={styles.suggestionChipsRow}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {suggestedItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.suggestionChip}
                          onPress={() => handleSuggestionPress(item)}
                          activeOpacity={0.7}
                          accessibilityLabel={`Add ${item.name}`}
                          accessibilityRole="button"
                          accessibilityHint={`Adds ${item.name} to shopping list`}
                        >
                          <Ionicons
                            name="add"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.suggestionChipText}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
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
                    accessibilityLabel={`${stat.label}: ${stat.value}`}
                    accessibilityRole="button"
                    accessibilityHint={`Navigate to ${stat.label}`}
                  >
                    <View
                      style={[
                        styles.quickStatIconContainer,
                        stat.iconBgStyle === "shopping" &&
                          styles.quickStatIconShopping,
                        stat.iconBgStyle === "recipes" &&
                          styles.quickStatIconRecipes,
                      ]}
                    >
                      <Ionicons
                        name={stat.icon}
                        size={20}
                        color={
                          stat.iconBgStyle === "shopping"
                            ? colors.primary
                            : colors.secondary
                        }
                      />
                    </View>
                    <Text style={styles.quickStatLabel}>{stat.label}</Text>
                    <View style={styles.quickStatValueRow}>
                      <Text style={styles.quickStatValue}>{stat.value}</Text>
                      <Ionicons
                        name={getDirectionalIcon("chevron-forward")}
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Right column: Important Chores */}
          <View
            style={[styles.rightColumn, !isTablet && styles.fullWidthColumn]}
          >
            <View style={styles.choresCard}>
              <View style={styles.choresSectionHeader}>
                <View style={styles.choresTitleBlock}>
                  <Text style={styles.choresSectionTitle}>
                    {t('chores.title')}
                  </Text>
                  <Text style={styles.choresSectionSubtitle}>
                    {t('chores.subtitle')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onNavigateToTab("Chores")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="View all chores"
                  accessibilityRole="button"
                  accessibilityHint="Navigate to chores screen"
                >
                  <Text style={styles.viewAllLink}>{t('buttons.viewAll', { ns: 'common' })}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.choreList}>
                {choresLoading ? (
                  // Show skeleton loaders while loading
                  <>
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                  </>
                ) : (
                  todayChores.map((chore) => (
                    <TouchableOpacity
                      key={chore.id}
                      style={[
                        styles.choreRow,
                        chore.isCompleted && styles.choreRowDone,
                        {
                          backgroundColor: getChoreRowBackground(
                            chore.isCompleted,
                          ),
                        },
                      ]}
                      onPress={() => toggleChore(chore.id)}
                      activeOpacity={0.8}
                      accessibilityLabel={`${chore.title}, ${chore.isCompleted ? "completed" : "pending"}, assigned to ${chore.assignee ?? "unassigned"}`}
                      accessibilityRole="button"
                      accessibilityHint={`Tap to mark ${chore.isCompleted ? "incomplete" : "complete"}`}
                    >
                      <View style={styles.choreLeftSection}>
                        <View style={styles.choreTopRow}>
                          <View style={styles.choreAvatarContainer}>
                            <SafeImage
                              uri={getAvatarUri(chore.assignee)}
                              style={styles.choreAvatar}
                            />
                          </View>
                          <View style={styles.choreContent}>
                            <Text
                              style={[
                                styles.choreTitle,
                                chore.isCompleted && styles.choreTitleDone,
                              ]}
                              numberOfLines={2}
                              ellipsizeMode="tail"
                            >
                              {chore.title}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.choreMetaRow}>
                          <Text style={styles.choreMetaText} numberOfLines={1}>
                            {chore.assignee ?? t('chores.unassigned')}
                          </Text>
                          <View style={styles.choreMetaDot} />
                          <Text style={styles.choreMetaText} numberOfLines={1}>
                            {formatChoreDueDateTime(chore.dueDate, chore.dueTime)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <TouchableOpacity
                style={styles.addHouseholdTaskButton}
                onPress={onOpenChoresModal}
                activeOpacity={0.7}
                accessibilityLabel="Add household task"
                accessibilityRole="button"
                accessibilityHint="Opens form to create a new chore"
              >
                <Ionicons name="add" size={16} color={colors.textMuted} />
                <Text style={styles.addHouseholdTaskText}>
                  {t('chores.addTask')}
                </Text>
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
