import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { formatTimeForDisplay, formatDateForDisplay } from '../../../common/utils/dateTimeUtils';
import { getDirectionalIcon } from '../../../common/utils/rtlIcons';
import { useResponsive } from '../../../common/hooks';
import { useCatalog } from '../../../common/hooks/useCatalog';
import { colors } from '../../../theme';
import { SafeImage } from '../../../common/components/SafeImage';
import { GrocerySearchBar } from '../../shopping/components/GrocerySearchBar';
import type { GroceryItem } from '../../shopping/components/GrocerySearchBar';
import type { ShoppingItem } from '../../../mocks/shopping';
import { useDashboardChores } from '../hooks/useDashboardChores';
import { useRecipes } from '../../recipes/hooks/useRecipes';
import { createShoppingService } from '../../shopping/services/shoppingService';
import { getActiveListId } from '../../shopping/utils/selectionUtils';
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

  const { groceryItems, frequentlyAddedItems } = useCatalog();
  const suggestedItems =
    frequentlyAddedItems.length > 0
      ? frequentlyAddedItems.slice(0, SUGGESTED_ITEMS_MAX)
      : groceryItems.slice(0, SUGGESTED_ITEMS_MAX);
  const { todayChores, toggleChore, isLoading: choresLoading } = useDashboardChores();

  const shouldUseMockData = config.mockData.enabled || !user || user?.isGuest === true;
  const shoppingService = useMemo(
    () => createShoppingService(shouldUseMockData ? 'guest' : 'signed-in'),
    [shouldUseMockData]
  );
  const { recipes } = useRecipes();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [shoppingListsCount, setShoppingListsCount] = useState(0);

  const loadShoppingData = useCallback(async () => {
    try {
      const data = await shoppingService.getShoppingData();
      setActiveListId((current) => getActiveListId(data.shoppingLists, current));
      setShoppingListsCount(data.shoppingLists.length);
    } catch (_err) {
      setActiveListId(null);
      setShoppingListsCount(0);
    }
  }, [shoppingService]);

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

  const handleSelectGroceryItem = (_item: GroceryItem) => {
    openShoppingModal();
  };

  const handleQuickAddGroceryItem = (_item: GroceryItem) => {
    openShoppingModal();
  };

  /**
   * Adds a suggested grocery item to the shopping list.
   * If the item already exists in the list, increments its quantity by 1.
   * Otherwise creates a new item with quantity 1.
   * Opens the shopping modal if there is no active list, or if the operation fails.
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
      } else {
        const newItemData: Partial<ShoppingItem> = {
          listId: activeListId,
          name: item.name.trim(),
          quantity: 1,
          category: item.category ?? 'Other',
          image: item.image ?? '',
        };
        await shoppingService.createItem(newItemData);
      }
    } catch (error) {
      console.error('Failed to add item to shopping list:', error);
      openShoppingModal();
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
                      items={groceryItems}
                      value={searchValue}
                      onChangeText={setSearchValue}
                      onSelectItem={handleSelectGroceryItem}
                      onQuickAddItem={handleQuickAddGroceryItem}
                      placeholder="e.g. 2 cartons of organic milk..."
                      variant="background"
                      showShadow={false}
                      allowCustomItems={true}
                      containerStyle={styles.grocerySearchBarContainer}
                    />
                  </View>
                  <TouchableOpacity style={styles.micButton}>
                    <Ionicons name="mic-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    ref={shoppingButtonRef}
                    style={styles.addButton}
                    onPress={handleAddToShopping}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={24} color={colors.textLight} />
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
    </SafeAreaView>
  );
}
