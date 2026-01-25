import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableWrapper } from '../../../../common/components/SwipeableWrapper';
import { GroceryCard, GroceryCardContent, QuantityControls } from '../../../../common/components/GroceryCard';
import { GrocerySearchBar } from '../GrocerySearchBar';
import { useEntitySyncStatusWithEntity } from '../../../../common/hooks/useSyncStatus';
import { SyncStatusIndicator } from '../../../../common/components/SyncStatusIndicator';
import { determineIndicatorStatus } from '../../../../common/utils/syncStatusUtils';
import { colors, borderRadius, pastelColors } from '../../../../theme';
import { styles } from './styles';
import { ShoppingListPanelProps } from './types';
import type { ShoppingItem } from '../../../../mocks/shopping';

/**
 * Shopping Item Card Component
 * Separate component to allow hook usage
 */
function ShoppingItemCard({
  item,
  index,
  bgColor,
  onDeleteItem,
  onQuantityChange,
  onToggleItemChecked,
}: {
  item: ShoppingItem;
  index: number;
  bgColor: string;
  onDeleteItem: (id: string) => void;
  onQuantityChange: (id: string, delta: number) => void;
  onToggleItemChecked: (id: string) => void;
}) {
  const isChecked = item.isChecked;
  
  // Check sync status for signed-in users
  const syncStatus = useEntitySyncStatusWithEntity('shoppingItems', item);
  const indicatorStatus = determineIndicatorStatus(syncStatus);

  return (
    <SwipeableWrapper
      key={item.id}
      onSwipeDelete={() => onDeleteItem(item.id)}
      backgroundColor={bgColor}
      borderRadius={borderRadius.xxl}
    >
      <GroceryCard backgroundColor={bgColor} style={isChecked ? styles.checkedCard : undefined}>
        <GroceryCardContent
          image={item.image}
          title={item.name}
          subtitle={item.category}
          titleStyle={isChecked ? styles.checkedTitle : undefined}
          onPress={() => onToggleItemChecked(item.id)}
          rightElement={
            <View style={styles.syncStatusRow}>
              {/* Sync status indicator */}
              {(syncStatus.isPending || syncStatus.isFailed) && (
                <SyncStatusIndicator status={indicatorStatus} size="small" />
              )}
              <QuantityControls
                quantity={item.quantity}
                onIncrement={() => onQuantityChange(item.id, 1)}
                onDecrement={() => onQuantityChange(item.id, -1)}
                minQuantity={1}
              />
            </View>
          }
        />
      </GroceryCard>
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
}: ShoppingListPanelProps) {
  // Memoize the render function to prevent unnecessary re-renders
  const renderShoppingItem = useCallback((item: typeof filteredItems[0], index: number) => {
    const bgColor = pastelColors[index % pastelColors.length];

    return (
      <ShoppingItemCard
        item={item}
        index={index}
        bgColor={bgColor}
        onDeleteItem={onDeleteItem}
        onQuantityChange={onQuantityChange}
        onToggleItemChecked={onToggleItemChecked}
      />
    );
  }, [onDeleteItem, onQuantityChange, onToggleItemChecked]);

  return (
    <View style={styles.leftColumn}>
      {/* List Header with Shopping Lists Drawer */}
      <View style={styles.listHeader}>
        <Text style={styles.listLabel}>My Lists</Text>
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
              <View style={[styles.listIconContainer, { backgroundColor: list.color + '20' }]}>
                <Ionicons name={list.icon} size={20} color={list.color} />
              </View>
              <View style={styles.listCardContent}>
                <Text style={[
                  styles.listCardName,
                  selectedList.id === list.id && styles.listCardNameActive
                ]}>
                  {list.name}
                </Text>
                <Text style={styles.listCardCount}>{list.itemCount} items</Text>
              </View>
              {selectedList.id === list.id && (
                <View style={[styles.listCardIndicator, { backgroundColor: list.color }]} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addListCard} onPress={onCreateList}>
            <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
            <Text style={styles.addListText}>New List</Text>
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
      />

      {/* Shopping Items */}
      <View style={styles.itemsList}>
        {filteredItems.map(renderShoppingItem)}
      </View>
    </View>
  );
}
