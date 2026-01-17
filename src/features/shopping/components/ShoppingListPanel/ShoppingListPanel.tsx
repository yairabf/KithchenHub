import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableShoppingItem } from '../SwipeableShoppingItem';
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
          <SwipeableShoppingItem
            key={item.id}
            onDelete={() => onDeleteItem(item.id)}
            backgroundColor={colors.surface}
          >
            <View style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => onQuantityChange(item.id, -1)}
                >
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => onQuantityChange(item.id, 1)}
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SwipeableShoppingItem>
        ))}
      </View>
    </View>
  );
}
