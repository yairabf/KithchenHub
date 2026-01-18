import React from 'react';
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
import { colors } from '../../../../theme';
import { mockGroceriesDB } from '../../../../data/groceryDatabase';
import { styles } from './styles';
import { ShoppingListPanelProps } from './types';

export function ShoppingListPanel({
  shoppingLists,
  selectedList,
  filteredItems,
  onSelectList,
  onCreateList,
  onSelectGroceryItem,
  onQuickAddItem,
  onQuantityChange,
  onDeleteItem,
}: ShoppingListPanelProps) {
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
        items={mockGroceriesDB}
        onSelectItem={onSelectGroceryItem}
        onQuickAddItem={onQuickAddItem}
        variant="surface"
        showShadow={true}
        allowCustomItems={true}
        containerStyle={styles.searchBarContainer}
      />

      {/* Shopping Items */}
      <View style={styles.itemsList}>
        {filteredItems.map((item) => (
          <SwipeableWrapper
            key={item.id}
            onSwipeDelete={() => onDeleteItem(item.id)}
            backgroundColor={colors.surface}
          >
            <GroceryCard backgroundColor={colors.surface}>
              <GroceryCardContent
                image={item.image}
                title={item.name}
                subtitle={item.category}
                rightElement={
                  <QuantityControls
                    quantity={item.quantity}
                    onIncrement={() => onQuantityChange(item.id, 1)}
                    onDecrement={() => onQuantityChange(item.id, -1)}
                    minQuantity={1}
                  />
                }
              />
            </GroceryCard>
          </SwipeableWrapper>
        ))}
      </View>
    </View>
  );
}
