import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableWrapper } from '../../../../common/components/SwipeableWrapper';
import { ListItemCardWrapper } from '../../../../common/components/ListItemCardWrapper';
import { GroceryCardContent, QuantityControls } from '../../../../common/components/GroceryCard';
import { GrocerySearchBar } from '../GrocerySearchBar';
import { EmptyState } from '../../../../common/components/EmptyState';
import { ListItemSkeleton } from '../../../../common/components/ListItemSkeleton';
import { colors, borderRadius } from '../../../../theme';
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
          title={item.name}
          subtitle={item.category}
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
          // Render items
          filteredItems.map(renderShoppingItem)
        )}
      </View>
    </View>
  );
}
