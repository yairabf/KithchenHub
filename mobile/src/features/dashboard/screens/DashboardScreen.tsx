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
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../contexts/AuthContext";
import {
  formatTimeForDisplay,
  formatDateForDisplay,
} from "../../../common/utils/dateTimeUtils";
import { useDebouncedRemoteSearch, useResponsive } from "../../../common/hooks";
import { useCatalog } from "../../../common/hooks/useCatalog";
import { colors } from "../../../theme";
import { SafeImage } from "../../../common/components/SafeImage";
import { Toast } from "../../../common/components/Toast";
import { ScreenHeader } from "../../../common/components/ScreenHeader";
import type { GroceryItem } from "../../shopping/components/GrocerySearchBar";
import { ImportantChoresCard } from "../components/ImportantChoresCard";
import { QuickAddCard } from "../components/QuickAddCard";
import { QuickStatsRow } from "../components/QuickStats";
import type { QuickStatItem } from "../components/QuickStats";
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
import { getAssigneeAvatarUri } from "../../../common/utils/avatarUtils";
import { config } from "../../../config";
import { styles } from "./styles";
import type { DashboardScreenProps } from "./types";
import { useTranslation } from "react-i18next";

const SUGGESTED_ITEMS_MAX = 8;

function isCustomGroceryItem(item: GroceryItem): boolean {
  return typeof item.id === "string" && item.id.startsWith("custom-");
}

function getSafeGroceryCategory(item: GroceryItem): string {
  const rawCategory =
    typeof item.category === "string" && item.category.trim().length > 0
      ? item.category
      : DEFAULT_CATEGORY.toLowerCase();
  return normalizeShoppingCategory(rawCategory);
}

export function DashboardScreen({
  onOpenShoppingModal,
  onOpenChoresModal,
  onNavigateToTab,
}: DashboardScreenProps) {
  const { t, i18n } = useTranslation(["dashboard", "recipes", "chores"]);
  const isRtl = i18n.dir() === 'rtl';
  const { user } = useAuth();
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

  const quickStats = useMemo<QuickStatItem[]>(
    () => [
      {
        icon: "basket-outline",
        label: t("quickStats.shoppingLists"),
        value:
          shoppingListsCount === 1
            ? t("quickStats.active", { count: 1 })
            : t("quickStats.active", { count: shoppingListsCount }),
        route: "Shopping",
        iconBgStyle: "shopping",
      },
      {
        icon: "book-outline",
        label: t("quickStats.savedRecipes"),
        value: recipes.length === 1 ? t("quickStats.item", { count: 1 }) : t("quickStats.items", { count: recipes.length }),
        route: "Recipes",
        iconBgStyle: "recipes",
      },
    ],
    [shoppingListsCount, recipes.length, t],
  );

  const displayName = user?.name ?? t("header.roleGuest");
  const userRole = user?.isGuest ? t("header.roleGuest") : t("header.roleKitchenLead");

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
      const trimmedItemName = item.name?.trim();
      if (!trimmedItemName) {
        showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
        return;
      }

      const data = await shoppingService.getShoppingData();
      const mainList = getMainList(data.shoppingLists);

      if (!mainList) {
          showToast(t("detail.toasts.noMainList", { ns: "recipes" }));
        return;
      }

      // Use the same pattern as ShoppingListsScreen but always use main list
      const normalizedItemName = trimmedItemName.toLowerCase();
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
        showToast(t("detail.toasts.ingredientUpdated", { ns: "recipes", name: item.name }));
      } else {
        const isCustomItem = isCustomGroceryItem(item);
        const categoryToUse = isCustomItem
          ? normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase())
          : getSafeGroceryCategory(item);

        const newItemData: Partial<ShoppingItem> = {
          listId: mainList.id,
          name: trimmedItemName,
          quantity: 1,
          category: categoryToUse,
          image: item.image ?? "",
          catalogItemId: !isCustomItem && item.id ? item.id : undefined,
        } as any; // Type assertion needed because ShoppingItem doesn't have catalogItemId

        await shoppingService.createItem(newItemData);
        showToast(t("detail.toasts.ingredientAdded", { ns: "recipes", name: item.name, listName: mainList.name }));
      }
      // Don't clear search value - keep dropdown open for multiple additions
    } catch (error) {
      console.error("Failed to add item to shopping list:", error);
      showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
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

  const handleQuickAddGroceryItem = async (item: GroceryItem) => {
    try {
      const data = await shoppingService.getShoppingData();
      const mainList = getMainList(data.shoppingLists);

      if (!mainList) {
        showToast(t("detail.toasts.noMainList", { ns: "recipes" }));
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
        logError: (message, error) => {
          console.error(message, error);
          showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
        },
      });

      // Refresh data after quick add to sync with server
      const updatedData = await shoppingService.getShoppingData();
      setAllItems(updatedData.shoppingItems);
    } catch (error) {
      console.error("Failed to add item to shopping list:", error);
      showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
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
    const trimmedItemName = item.name?.trim();
    if (!trimmedItemName) {
      showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
      return;
    }

    const addQuantity = 1;
    try {
      const data = await shoppingService.getShoppingData();
      const normalizedItemName = trimmedItemName.toLowerCase();
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
        showToast(t("detail.toasts.ingredientUpdated", { ns: "recipes", name: item.name }));
      } else {
        const newItemData: Partial<ShoppingItem> = {
          listId: activeListId,
          name: trimmedItemName,
          quantity: 1,
          category: getSafeGroceryCategory(item),
          image: item.image ?? "",
        };
        await shoppingService.createItem(newItemData);
        showToast(t("detail.toasts.ingredientAdded", { ns: "recipes", name: item.name, listName: t("quickStats.shoppingLists") }));
      }
      // Refresh shopping data to update the UI immediately
      await loadShoppingData();
    } catch (error) {
      console.error("Failed to add item to shopping list:", error);
      showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
      // Only open modal if error is related to missing list, not other errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("list") || errorMessage.includes("List")) {
        openShoppingModal();
      }
    }
  };

  const handleStatPress = (route: QuickStatItem["route"]) => {
    if (route) {
      onNavigateToTab(route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t("header.title")}
        titleIcon="grid-outline"
        rightSlot={(
          <View style={styles.headerRight}>
            <View style={styles.brandIconContainer}>
              <Image
                source={require("../../../../assets/fullhouse_icon.png")}
                style={styles.brandIcon}
                resizeMode="contain"
                accessibilityLabel="FullHouse icon"
              />
            </View>
            {isTablet && (
              <View style={styles.dateTimeContainer}>
                <Text style={[styles.timeText, isRtl && styles.rtlNativeText]}>{formattedTime}</Text>
                <Text style={[styles.dateText, isRtl && styles.rtlNativeText]}>{formattedDate}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.notificationButton}
              accessibilityLabel={t("notifications.buttonLabel")}
              accessibilityRole="button"
              accessibilityHint={t("notifications.buttonHint")}
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
                  <Text style={[styles.profileRole, isRtl && styles.rtlNativeText]}>{userRole}</Text>
                  <Text style={[styles.profileName, isRtl && styles.rtlNativeText]}>{displayName}</Text>
                </View>
              )}
              <View style={styles.avatarContainer}>
                {user?.avatarUrl ? (
                  <SafeImage uri={user.avatarUrl} style={styles.avatar} />
                ) : (
                  <SafeImage
                    uri={getAssigneeAvatarUri(user?.name)}
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
              <QuickAddCard
                isTablet={isTablet}
                isRtl={isRtl}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchResults={searchResults}
                onSelectItem={handleSelectGroceryItem}
                onQuickAddItem={handleQuickAddGroceryItem}
                showSuggestedItems={showSuggestedItems}
                onToggleSuggestedItems={() => setShowSuggestedItems((current) => !current)}
                suggestedItems={suggestedItems}
                onSuggestionPress={handleSuggestionPress}
              />

              <QuickStatsRow
                stats={quickStats}
                isRtl={isRtl}
                onPressStat={handleStatPress}
              />
            </View>
          </View>

          <ImportantChoresCard
            isTablet={isTablet}
            isRtl={isRtl}
            choresLoading={choresLoading}
            chores={todayChores}
            onToggleChore={toggleChore}
            onNavigateToChores={() => onNavigateToTab("Chores")}
            onOpenChoresModal={onOpenChoresModal}
          />
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
