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
import { FrequentlyAddedSection } from "../components/FrequentlyAddedSection";
import { ImportantChoresCard } from "../components/ImportantChoresCard";
import { QuickAddCard } from "../components/QuickAddCard";
import type { ShoppingItem, ShoppingList } from "../../../mocks/shopping";
import { useDashboardChores } from "../hooks/useDashboardChores";
import { createShoppingService } from "../../shopping/services/shoppingService";
import { getMainList } from "../../shopping/utils/selectionUtils";
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
  const [searchValue, setSearchValue] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const { searchGroceries } = useCatalog();
  const { results: searchResults } = useDebouncedRemoteSearch<GroceryItem>({
    query: searchValue,
    searchFn: searchGroceries,
    onError: (error) => {
      console.error("Search failed:", error);
    },
  });
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
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [frequentItems, setFrequentItems] = useState<GroceryItem[]>([]);
  const [mainList, setMainList] = useState<ShoppingList | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Always-current snapshot of allItems, read synchronously inside event handlers
  // to avoid stale closure captures during rapid concurrent taps.
  const allItemsRef = useRef<ShoppingItem[]>([]);
  allItemsRef.current = allItems;

  // Tracks catalog IDs / names of items currently being added to prevent
  // concurrent rapid taps of the same item from racing past the dedup check.
  const pendingQuickAddKeys = useRef<Set<string>>(new Set());

  const loadShoppingData = useCallback(async () => {
    try {
      // getShoppingData passes the current i18n.language to the aggregate endpoint,
      // so item names are returned in the active locale. i18n.language is listed as
      // a dependency so this callback is recreated (and re-run) on language changes.
      const data = await shoppingService.getShoppingData();
      setAllItems(data.shoppingItems);
      setFrequentItems(data.frequentlyAddedItems);
      setMainList(getMainList(data.shoppingLists));
    } catch (_err) {
      setAllItems([]);
      setFrequentItems([]);
      setMainList(null);
    }
  }, [shoppingService, i18n.language]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        loadShoppingData(),
        refreshChores(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadShoppingData, refreshChores]);

  useEffect(() => {
    loadShoppingData();
  }, [loadShoppingData]);

  useFocusEffect(
    useCallback(() => {
      loadShoppingData();
    }, [loadShoppingData]),
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

  /** Opens the quick-add shopping modal. */
  const openShoppingModal = () => {
    onOpenShoppingModal();
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
        openShoppingModal();
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

      await loadShoppingData();
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
    if (!mainList) {
      showToast(t("detail.toasts.noMainList", { ns: "recipes" }));
      openShoppingModal();
      return;
    }

    // Prevent concurrent rapid taps of the same item from racing past the
    // dedup check before React re-renders with the updated allItems state.
    const addKey = item.id ?? item.name;
    if (pendingQuickAddKeys.current.has(addKey)) return;
    pendingQuickAddKeys.current.add(addKey);

    try {
      // Read from the ref (not the closure) so we always see the latest allItems,
      // including in-flight optimistic items added by the very first tap.
      await quickAddItem(item, mainList, {
        allItems: allItemsRef.current,
        setAllItems,
        createItem,
        updateItem: async (itemId, updates) => {
          try {
            return await shoppingService.updateItem(itemId, updates);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes('not found')) {
              // The item exists in cached state but was deleted from the server.
              // Remove it so the next tap creates it fresh instead of retrying a
              // stale update that will always 404.
              setAllItems((prev) => prev.filter((i) => i.id !== itemId));
            }
            throw error;
          }
        },
        executeWithOptimisticUpdate,
        logError: (message, error) => {
          console.error(message, error);
          showToast(t("detail.toasts.ingredientAddFailed", { ns: "recipes" }));
        },
      });
    } finally {
      pendingQuickAddKeys.current.delete(addKey);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t("header.title")}
        titleIconSlot={(
          <Image
            source={require("../../../../assets/fullhouse_icon.png")}
            style={styles.titleBrandIcon}
            resizeMode="contain"
            accessibilityLabel="FullHouse icon"
          />
        )}
        rightSlot={(
          <View style={styles.headerRight}>
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
        <View style={[styles.mainGrid, !isTablet && styles.mainGridPhone]}>
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
                showMainListBadge={mainList != null}
              />

              <FrequentlyAddedSection
                isTablet={isTablet}
                isRtl={isRtl}
                items={frequentItems}
                onItemPress={handleQuickAddGroceryItem}
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
