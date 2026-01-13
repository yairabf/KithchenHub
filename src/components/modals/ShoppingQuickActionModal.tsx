import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { CenteredModal } from '../common/CenteredModal';

interface ShoppingList {
  id: string;
  name: string;
  color: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  image?: string;
  quantity?: number;
  category?: string;
}

interface GroceryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  defaultQuantity: number;
}

interface ShoppingQuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  buttonPosition?: { x: number; y: number; width: number; height: number };
}

const mockLists: ShoppingList[] = [
  { id: '1', name: 'Weekly Groceries', color: colors.primary },
  { id: '2', name: 'Party Supplies', color: colors.shopping },
  { id: '3', name: 'Costco Run', color: colors.recipes },
];

// Mock Groceries Database - Available items to search and add
const mockGroceriesDB: GroceryItem[] = [
  // Fruits
  { id: 'g1', name: 'Banana', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100', category: 'Fruits', defaultQuantity: 6 },
  { id: 'g2', name: 'Apple', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100', category: 'Fruits', defaultQuantity: 4 },
  { id: 'g3', name: 'Green Apple', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100', category: 'Fruits', defaultQuantity: 4 },
  { id: 'g4', name: 'Orange', image: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=100', category: 'Fruits', defaultQuantity: 5 },
  { id: 'g5', name: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g6', name: 'Blueberries', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g7', name: 'Grapes', image: 'https://images.unsplash.com/photo-1599819177331-6d6e0b9e5d0e?w=100', category: 'Fruits', defaultQuantity: 1 },
  { id: 'g8', name: 'Watermelon', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784210?w=100', category: 'Fruits', defaultQuantity: 1 },
  { id: 'g9', name: 'Mango', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g10', name: 'Avocado', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100', category: 'Fruits', defaultQuantity: 3 },
  
  // Vegetables
  { id: 'g11', name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=100', category: 'Vegetables', defaultQuantity: 4 },
  { id: 'g12', name: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100', category: 'Vegetables', defaultQuantity: 2 },
  { id: 'g13', name: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g14', name: 'Lettuce', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g15', name: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g16', name: 'Bell Pepper', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=100', category: 'Vegetables', defaultQuantity: 3 },
  { id: 'g17', name: 'Cucumber', image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=100', category: 'Vegetables', defaultQuantity: 2 },
  { id: 'g18', name: 'Onion', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100', category: 'Vegetables', defaultQuantity: 3 },
  
  // Dairy
  { id: 'g19', name: 'Whole Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100', category: 'Dairy', defaultQuantity: 2 },
  { id: 'g20', name: 'Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100', category: 'Dairy', defaultQuantity: 12 },
  { id: 'g21', name: 'Greek Yogurt', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100', category: 'Dairy', defaultQuantity: 4 },
  { id: 'g22', name: 'Cheddar Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g23', name: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100', category: 'Dairy', defaultQuantity: 1 },
  
  // Meat & Seafood
  { id: 'g24', name: 'Chicken Breast', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100', category: 'Meat', defaultQuantity: 2 },
  { id: 'g25', name: 'Ground Beef', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=100', category: 'Meat', defaultQuantity: 1 },
  { id: 'g26', name: 'Salmon', image: 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=100', category: 'Seafood', defaultQuantity: 2 },
  { id: 'g27', name: 'Shrimp', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=100', category: 'Seafood', defaultQuantity: 1 },
  
  // Bakery & Grains
  { id: 'g28', name: 'White Bread', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100', category: 'Bakery', defaultQuantity: 1 },
  { id: 'g29', name: 'Bagels', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100', category: 'Bakery', defaultQuantity: 6 },
  { id: 'g30', name: 'White Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', category: 'Grains', defaultQuantity: 1 },
  { id: 'g31', name: 'Pasta', image: 'https://images.unsplash.com/photo-1551462147-37cbd8c6c4c8?w=100', category: 'Grains', defaultQuantity: 2 },
  
  // Snacks
  { id: 'g32', name: 'Potato Chips', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100', category: 'Snacks', defaultQuantity: 2 },
  { id: 'g33', name: 'Almonds', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=100', category: 'Nuts', defaultQuantity: 1 },
  { id: 'g34', name: 'Granola Bars', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Snacks', defaultQuantity: 6 },
  
  // Beverages
  { id: 'g35', name: 'Orange Juice', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100', category: 'Beverages', defaultQuantity: 1 },
  { id: 'g36', name: 'Coffee', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=100', category: 'Beverages', defaultQuantity: 1 },
];

export function ShoppingQuickActionModal({ visible, onClose, buttonPosition }: ShoppingQuickActionModalProps) {
  const [activeListId, setActiveListId] = useState(mockLists[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedGroceryItem, setSelectedGroceryItem] = useState<GroceryItem | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const inputRef = useRef<TextInput>(null);

  const activeList = mockLists.find(l => l.id === activeListId);

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mockGroceriesDB.filter(item =>
      item.name.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    setShowSearchDropdown(searchQuery.trim().length > 0 && searchResults.length > 0);
  }, [searchQuery, searchResults]);

  const handleSelectGroceryItem = (groceryItem: GroceryItem) => {
    setSelectedGroceryItem(groceryItem);
    setQuantityInput(groceryItem.defaultQuantity.toString());
    setShowQuantityModal(true);
    setShowSearchDropdown(false);
  };

  const handleAddToList = () => {
    if (!selectedGroceryItem) return;
    
    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    // TODO: In a real implementation, this would call a callback prop to add the item
    // to the actual shopping list in the parent component
    console.log('Adding item:', {
      name: selectedGroceryItem.name,
      quantity,
      category: selectedGroceryItem.category,
      listId: activeListId,
    });

    // Reset and close
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setQuantityInput('1');
    setSearchQuery('');
  };

  const handleCancelQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setQuantityInput('1');
  };

  const handleQuantityChange = (delta: number) => {
    const current = parseInt(quantityInput, 10) || 0;
    const newValue = Math.max(1, current + delta);
    setQuantityInput(newValue.toString());
  };

  return (
    <>
      <CenteredModal
        visible={visible && !showQuantityModal}
        onClose={onClose}
        title="Quick Add"
        showActions={false}
      >
        {/* List Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.listSwitcher}
          contentContainerStyle={styles.listSwitcherContent}
        >
          {mockLists.map(list => (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.listBubble,
                activeListId === list.id && { backgroundColor: list.color },
              ]}
              onPress={() => setActiveListId(list.id)}
            >
              <Text
                style={[
                  styles.listBubbleText,
                  activeListId === list.id && { color: colors.textLight },
                ]}
              >
                {list.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search groceries to add..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showSearchDropdown && (
            <View style={styles.searchDropdown}>
              <ScrollView 
                style={styles.searchDropdownScroll}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectGroceryItem(item)}
                  >
                    <Image source={{ uri: item.image }} style={styles.searchResultImage} />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultCategory}>{item.category}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={activeList?.color} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </CenteredModal>

      {/* Quantity Selection Modal */}
      <CenteredModal
        visible={showQuantityModal}
        onClose={handleCancelQuantityModal}
        title={`Add to ${activeList?.name}`}
        confirmText="Add to List"
        onConfirm={handleAddToList}
        confirmColor={activeList?.color}
      >
        {selectedGroceryItem && (
          <>
            <View style={styles.quantityItemDisplay}>
              <Image 
                source={{ uri: selectedGroceryItem.image }} 
                style={styles.quantityItemImage} 
              />
              <View style={styles.quantityItemInfo}>
                <Text style={styles.quantityItemName}>{selectedGroceryItem.name}</Text>
                <Text style={styles.quantityItemCategory}>{selectedGroceryItem.category}</Text>
              </View>
            </View>

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(-1)}
                >
                  <Ionicons name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInputField}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(1)}
                >
                  <Ionicons name="add" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </CenteredModal>
    </>
  );
}

const styles = StyleSheet.create({
  listSwitcher: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  listSwitcherContent: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  listBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  listBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  searchDropdown: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchDropdownScroll: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  searchResultImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  searchResultCategory: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  quantityItemDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  quantityItemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  quantityItemInfo: {
    flex: 1,
  },
  quantityItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  quantityItemCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quantitySection: {
    marginBottom: 0,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInputField: {
    width: 80,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
