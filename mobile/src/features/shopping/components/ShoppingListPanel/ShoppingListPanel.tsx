import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableWrapper } from '../../../../common/components/SwipeableWrapper';
import { ListItemCardWrapper } from '../../../../common/components/ListItemCardWrapper';
import { GroceryCardContent, QuantityControls } from '../../../../common/components/GroceryCard';
import { GrocerySearchBar } from '../GrocerySearchBar';
import { EmptyState } from '../../../../common/components/EmptyState';
import { ListItemSkeleton } from '../../../../common/components/ListItemSkeleton';
import { colors, borderRadius } from '../../../../theme';
import { getCategoryImageSource } from '../../utils/categoryImage';
import { normalizeShoppingCategory } from '../../constants/categories';
import { toggleSetItem } from '../../../../common/utils/setUtils';
import { styles } from './styles';
import { ShoppingListPanelProps, ShoppingItemCardProps } from './types';

/**
 * Shopping Item Card Component
 * Renders a single list item with swipe-to-delete and quantity controls.
 */
function ShoppingItemCard({
  item,
  index,
  onDeleteItem,
  onQuantityChange,
  onToggleItemChecked,
}: ShoppingItemCardProps) {
  const isChecked = item.isChecked;
  const fallbackCategoryImage = getCategoryImageSource(item.category);

  return (
    <SwipeableWrapper
      key={item.id}
      onSwipeDelete={() => onDeleteItem(item.id)}
      borderRadius={borderRadius.xxl}
    >
      <ListItemCardWrapper
        style={[styles.shoppingItemCard, isChecked ? styles.checkedCard : undefined]}
      >
        <GroceryCardContent
          image={item.image}
          customIcon={
            fallbackCategoryImage ? (
              <Image
                source={fallbackCategoryImage}
                style={styles.fallbackCategoryImage}
                resizeMode="contain"
              />
            ) : undefined
          }
          title={item.name}
          titleStyle={isChecked ? styles.checkedTitle : undefined}
          onPress={() => onToggleItemChecked(item.id)}
          rightElement={
            <QuantityControls
              quantity={item.quantity}
              onIncrement={() => onQuantityChange(item.id, 1)}
              onDecrement={() => onQuantityChange(item.id, -1)}
              minQuantity={1}
            />
          }
        />
      </ListItemCardWrapper>
    </SwipeableWrapper>
  );
}

export function ShoppingListPanel({
  shoppingLists,
  selectedList,
  filteredItems,
  groceryItems,
  onSelectList,
  onCreateList,
  onSelectGroceryItem,
  onQuickAddItem,
  onQuantityChange,
  onDeleteItem,
  onToggleItemChecked,
  searchQuery,
  onSearchChange,
  searchMode = 'local',
  isLoading = false,
  onEmptyStateAction,
}: ShoppingListPanelProps) {
  /**
   * Track which categories are collapsed.
   * Uses a Set for O(1) lookup performance.
   */
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  /**
   * Toggles the collapsed state of a category.
   * Uses immutable Set operations to ensure proper React re-renders.
   * 
   * @param category - The normalized category name to toggle
   */
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => toggleSetItem(prev, category));
  }, []);

  /**
   * Groups filtered items by normalized category name.
   * Handles edge cases like missing categories, normalization errors, and empty values.
   * 
   * @returns Array of category groups sorted alphabetically, each containing category name and items
   */
  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof filteredItems>();
    const OTHER_CATEGORY = 'other';

    filteredItems.forEach((item) => {
      try {
        // Validate category exists and is a string
        if (!item.category || typeof item.category !== 'string') {
          console.warn(`Invalid category for item ${item.id}:`, item.category);
          const bucket = groups.get(OTHER_CATEGORY) ?? [];
          bucket.push(item);
          groups.set(OTHER_CATEGORY, bucket);
          return;
        }

        const key = normalizeShoppingCategory(item.category);
        
        // Validate normalized result
        if (!key || typeof key !== 'string' || key.trim() === '') {
          console.warn(`Category normalization failed for item ${item.id}, category: ${item.category}`);
          const bucket = groups.get(OTHER_CATEGORY) ?? [];
          bucket.push(item);
          groups.set(OTHER_CATEGORY, bucket);
          return;
        }

        const bucket = groups.get(key);
        if (bucket) {
          bucket.push(item);
        } else {
          groups.set(key, [item]);
        }
      } catch (error) {
        console.error(`Error processing item ${item.id} category "${item.category}":`, error);
        // Add to "Other" category as fallback
        const bucket = groups.get(OTHER_CATEGORY) ?? [];
        bucket.push(item);
        groups.set(OTHER_CATEGORY, bucket);
      }
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({
        category,
        items,
      }));
  }, [filteredItems]);

  /**
   * Formats category name for display (capitalizes first letter).
   * 
   * @param category - The normalized category name
   * @returns Formatted category name for display
   */
  const formatCategoryName = useCallback((category: string) => {
    if (!category) return 'Other';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }, []);

  /**
   * Memoizes category images to avoid redundant lookups.
   * Pre-computes all category images once when groupedItems changes.
   * 
   * @returns Map of category names to their image sources
   */
  const categoryImages = useMemo(() => {
    const imageMap = new Map<string, ReturnType<typeof getCategoryImageSource>>();
    groupedItems.forEach(({ category }) => {
      if (!imageMap.has(category)) {
        imageMap.set(category, getCategoryImageSource(category));
      }
    });
    return imageMap;
  }, [groupedItems]);

  // Memoize the render function to prevent unnecessary re-renders
  const renderShoppingItem = useCallback((item: typeof filteredItems[0], index: number) => {
    return (
      <ShoppingItemCard
        key={item.id}
        item={item}
        index={index}
        onDeleteItem={onDeleteItem}
        onQuantityChange={onQuantityChange}
        onToggleItemChecked={onToggleItemChecked}
      />
    );
  }, [onDeleteItem, onQuantityChange, onToggleItemChecked]);

  return (
    <View style={styles.leftColumn}>
      {/* List Header with Shopping Lists Drawer */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>My Active Lists</Text>
        <TouchableOpacity
          style={styles.listHeaderButton}
          onPress={onCreateList}
        >
          <Ionicons name="add" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Shopping Lists Drawer */}
      <View style={styles.listsDrawer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listsDrawerContent}
        >
          {shoppingLists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.listCard,
                selectedList.id === list.id && styles.listCardActive
              ]}
              onPress={() => onSelectList(list)}
            >
              {selectedList.id === list.id && <View style={styles.listCardDot} />}
              <View style={[styles.listIconContainer, { backgroundColor: list.color + '20' }]}>
                <Ionicons name={list.icon} size={20} color={list.color} />
              </View>
              <View style={styles.listCardContent}>
                <View style={styles.listCardNameRow}>
                  <Text style={[
                    styles.listCardName,
                    selectedList.id === list.id && styles.listCardNameActive
                  ]}>
                    {list.name}
                  </Text>
                  {list.isMain && (
                    <View style={styles.mainBadge}>
                      <Ionicons name="home" size={12} color={colors.recipes} />
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.listCardCount}>{list.itemCount} items</Text>
              </View>
              {selectedList.id === list.id && (
                <View style={[styles.listCardIndicator, { backgroundColor: list.color }]} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addListCard} onPress={onCreateList}>
            <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
            <Text style={styles.addListText}>Create New</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <GrocerySearchBar
        items={groceryItems}
        onSelectItem={onSelectGroceryItem}
        onQuickAddItem={onQuickAddItem}
        variant="surface"
        showShadow={true}
        allowCustomItems={true}
        containerStyle={styles.searchBarContainer}
        value={searchQuery}
        onChangeText={onSearchChange}
        searchMode={searchMode}
      />

      {/* Shopping Items */}
      <View style={styles.itemsList}>
        {isLoading ? (
          // Loading skeletons
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <ListItemSkeleton key={index} />
            ))}
          </>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No items in this list"
            description="Start adding items to your shopping list"
            actionLabel={onEmptyStateAction ? 'Add first item' : undefined}
            onActionPress={onEmptyStateAction}
            actionColor={colors.shopping}
          />
        ) : (
          groupedItems.map(({ category, items }) => {
            const categoryImage = categoryImages.get(category);
            const isCollapsed = collapsedCategories.has(category);

            return (
              <View key={category} style={styles.categoryGroup}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatCategoryName(category)} category, ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                  accessibilityHint={`Double tap to ${isCollapsed ? 'expand and show' : 'collapse and hide'} items in this category`}
                  accessibilityState={{ 
                    expanded: !isCollapsed,
                    disabled: false
                  }}
                  testID={`category-header-${category}`}
                >
                  {categoryImage ? (
                    <Image
                      source={categoryImage}
                      style={styles.categoryHeaderIcon}
                      resizeMode="contain"
                      accessibilityElementsHidden={true}
                      importantForAccessibility="no"
                    />
                  ) : (
                    <View 
                      style={styles.categoryHeaderIconPlaceholder}
                      accessibilityElementsHidden={true}
                      importantForAccessibility="no"
                    />
                  )}
                  <Text style={styles.categoryHeaderText}>{formatCategoryName(category)}</Text>
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={colors.textSecondary}
                    style={styles.categoryChevron}
                    accessibilityElementsHidden={true}
                    importantForAccessibility="no"
                  />
                </TouchableOpacity>
                {!isCollapsed && items.map(renderShoppingItem)}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
