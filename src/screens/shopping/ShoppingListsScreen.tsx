import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { CategoryModal } from '../../components/shopping/CategoryModal';
import { AllItemsModal } from '../../components/shopping/AllItemsModal';
import { SwipeableShoppingItem } from '../../components/shopping/SwipeableShoppingItem';
import { CenteredModal } from '../../components/common/CenteredModal';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { GrocerySearchBar, GroceryItem } from '../../components/common/GrocerySearchBar';
import { colors, spacing, borderRadius, typography, shadows, componentSize } from '../../theme';
import { mockGroceriesDB } from '../../data/groceryDatabase';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface ShoppingItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  category: string;
  listId: string;
}

interface Category {
  id: string;
  name: string;
  itemCount: number;
  image: string;
  backgroundColor: string;
}

interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  icon: IoniconsName;
  color: string;
}

// Mock Data
const mockItems: ShoppingItem[] = [
  // Weekly Groceries (list 1)
  { id: '1', name: 'Banana', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100', quantity: 6, category: 'Fruits', listId: '1' },
  { id: '2', name: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100', quantity: 2, category: 'Dairy', listId: '1' },
  { id: '3', name: 'Bread', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100', quantity: 1, category: 'Bakery', listId: '1' },
  { id: '4', name: 'Chicken Breast', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100', quantity: 3, category: 'Meat', listId: '1' },
  { id: '5', name: 'Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100', quantity: 12, category: 'Dairy', listId: '1' },
  { id: '6', name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=100', quantity: 4, category: 'Vegetables', listId: '1' },
  
  // Party Supplies (list 2)
  { id: '7', name: 'Chips', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100', quantity: 5, category: 'Snacks', listId: '2' },
  { id: '8', name: 'Soda', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100', quantity: 8, category: 'Beverages', listId: '2' },
  { id: '9', name: 'Party Cups', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100', quantity: 50, category: 'Supplies', listId: '2' },
  { id: '10', name: 'Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100', quantity: 1, category: 'Sweets', listId: '2' },
  { id: '11', name: 'Ice Cream', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100', quantity: 3, category: 'Freezer', listId: '2' },
  
  // Meal Prep (list 3)
  { id: '12', name: 'Brown Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', quantity: 2, category: 'Grains', listId: '3' },
  { id: '13', name: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100', quantity: 3, category: 'Vegetables', listId: '3' },
  { id: '14', name: 'Salmon', image: 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=100', quantity: 4, category: 'Seafood', listId: '3' },
  { id: '15', name: 'Sweet Potato', image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=100', quantity: 6, category: 'Vegetables', listId: '3' },
  { id: '16', name: 'Greek Yogurt', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100', quantity: 5, category: 'Dairy', listId: '3' },
  
  // Pantry Restock (list 4)
  { id: '17', name: 'Pasta', image: 'https://images.unsplash.com/photo-1551462147-37cbd8c6c4c8?w=100', quantity: 4, category: 'Grains', listId: '4' },
  { id: '18', name: 'Canned Beans', image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=100', quantity: 6, category: 'Canned', listId: '4' },
  { id: '19', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100', quantity: 1, category: 'Oils', listId: '4' },
  { id: '20', name: 'Flour', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100', quantity: 2, category: 'Baking', listId: '4' },
  
  // Healthy Snacks (list 5)
  { id: '21', name: 'Almonds', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=100', quantity: 2, category: 'Nuts', listId: '5' },
  { id: '22', name: 'Protein Bars', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', quantity: 12, category: 'Snacks', listId: '5' },
  { id: '23', name: 'Hummus', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=100', quantity: 3, category: 'Dips', listId: '5' },
  { id: '24', name: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=100', quantity: 1, category: 'Vegetables', listId: '5' },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Sweets', itemCount: 12, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', backgroundColor: 'rgba(255, 182, 193, 0.85)' },
  { id: '2', name: 'Freezer', itemCount: 18, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200', backgroundColor: 'rgba(173, 216, 230, 0.85)' },
  { id: '3', name: 'Meat', itemCount: 43, image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200', backgroundColor: 'rgba(210, 180, 140, 0.85)' },
  { id: '4', name: 'Snacks', itemCount: 89, image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200', backgroundColor: 'rgba(255, 218, 185, 0.85)' },
  { id: '5', name: 'Dairy', itemCount: 45, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200', backgroundColor: 'rgba(255, 250, 205, 0.85)' },
  { id: '6', name: 'Beverages', itemCount: 67, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200', backgroundColor: 'rgba(144, 238, 144, 0.85)' },
  { id: '7', name: 'Dips', itemCount: 89, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=200', backgroundColor: 'rgba(255, 160, 122, 0.85)' },
  { id: '8', name: 'Cheeses', itemCount: 12, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200', backgroundColor: 'rgba(255, 228, 181, 0.85)' },
  { id: '9', name: 'Teas', itemCount: 34, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', backgroundColor: 'rgba(176, 224, 230, 0.85)' },
];

// Calculate item counts dynamically
const getListItemCount = (listId: string) => {
  return mockItems.filter(item => item.listId === listId).length;
};

const mockShoppingLists: ShoppingList[] = [
  { id: '1', name: 'Weekly Groceries', itemCount: getListItemCount('1'), icon: 'cart-outline', color: '#10B981' },
  { id: '2', name: 'Party Supplies', itemCount: getListItemCount('2'), icon: 'gift-outline', color: '#F59E0B' },
  { id: '3', name: 'Meal Prep', itemCount: getListItemCount('3'), icon: 'restaurant-outline', color: '#8B5CF6' },
  { id: '4', name: 'Pantry Restock', itemCount: getListItemCount('4'), icon: 'cube-outline', color: '#EF4444' },
  { id: '5', name: 'Healthy Snacks', itemCount: getListItemCount('5'), icon: 'nutrition-outline', color: '#06B6D4' },
];

export function ShoppingListsScreen() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(mockShoppingLists);
  const [selectedList, setSelectedList] = useState<ShoppingList>(mockShoppingLists[0]);
  const [allItems, setAllItems] = useState<ShoppingItem[]>(mockItems);
  const [selectedGroceryItem, setSelectedGroceryItem] = useState<GroceryItem | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState<IoniconsName>('cart-outline');
  const [newListColor, setNewListColor] = useState('#10B981');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAllItemsModal, setShowAllItemsModal] = useState(false);

  // Filter items based on selected list
  const filteredItems = allItems.filter(item => item.listId === selectedList.id);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setAllItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setAllItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSelectGroceryItem = (groceryItem: GroceryItem) => {
    setSelectedGroceryItem(groceryItem);
    setQuantityInput(groceryItem.defaultQuantity.toString());
    setShowQuantityModal(true);
    // Keep dropdown open so user can continue adding items after modal closes
  };

  const handleQuickAddItem = (groceryItem: GroceryItem) => {
    const quantity = groceryItem.defaultQuantity;

    // Check if item already exists in the selected list
    const existingItemIndex = allItems.findIndex(
      item => item.name === groceryItem.name && item.listId === selectedList.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      setAllItems(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      // Add new item to list
      const newItem: ShoppingItem = {
        id: `item-${Date.now()}`,
        name: groceryItem.name,
        image: groceryItem.image,
        quantity: quantity,
        category: groceryItem.category,
        listId: selectedList.id,
      };
      setAllItems(prev => [...prev, newItem]);
    }

    // Keep dropdown open and search query intact for rapid multi-item addition
  };

  const handleAddToList = () => {
    if (!selectedGroceryItem) return;
    
    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    // Check if item already exists in the selected list
    const existingItemIndex = allItems.findIndex(
      item => item.name === selectedGroceryItem.name && item.listId === selectedList.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      setAllItems(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      // Add new item to list
      const newItem: ShoppingItem = {
        id: `item-${Date.now()}`,
        name: selectedGroceryItem.name,
        image: selectedGroceryItem.image,
        quantity: quantity,
        category: selectedGroceryItem.category,
        listId: selectedList.id,
      };
      setAllItems(prev => [...prev, newItem]);
    }

    // Reset and close
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setQuantityInput('1');
  };

  const handleCancelQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedGroceryItem(null);
    setQuantityInput('1');
  };

  const handleQuantityInputChange = (delta: number) => {
    const current = parseInt(quantityInput, 10) || 0;
    const newValue = Math.max(1, current + delta);
    setQuantityInput(newValue.toString());
  };

  const handleOpenCreateListModal = () => {
    setShowCreateListModal(true);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor('#10B981');
  };

  const handleCancelCreateListModal = () => {
    setShowCreateListModal(false);
    setNewListName('');
    setNewListIcon('cart-outline');
    setNewListColor('#10B981');
  };

  const handleCreateList = () => {
    const trimmedName = newListName.trim();
    if (!trimmedName) {
      return;
    }

    const newList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: trimmedName,
      itemCount: 0,
      icon: newListIcon,
      color: newListColor,
    };

    setShoppingLists(prev => [...prev, newList]);
    setSelectedList(newList);
    handleCancelCreateListModal();
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory('');
  };

  const handleSelectItemFromCategory = (groceryItem: GroceryItem) => {
    setShowCategoryModal(false);
    handleSelectGroceryItem(groceryItem);
  };

  const getCategoryItems = (categoryName: string): GroceryItem[] => {
    return mockGroceriesDB.filter(item => item.category === categoryName);
  };

  const handleOpenAllItemsModal = () => {
    setShowAllItemsModal(true);
  };

  const handleCloseAllItemsModal = () => {
    setShowAllItemsModal(false);
  };

  const handleSelectItemFromAllItems = (groceryItem: GroceryItem) => {
    setShowAllItemsModal(false);
    handleSelectGroceryItem(groceryItem);
  };

  const handleQuickAddItemFromAllItems = (groceryItem: GroceryItem) => {
    // Don't close modal - keep it open for rapid adding
    handleQuickAddItem(groceryItem);
  };

  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuickAdd = () => {
    handleOpenAllItemsModal();
  };

  return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{selectedList.name}</Text>
            <Text style={styles.headerSubtitle}>{totalItems} items total</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.mainGrid}>
          {/* Left Column - Shopping List */}
          <View style={styles.leftColumn}>
            {/* List Header with Shopping Lists Drawer */}
            <View style={styles.listHeader}>
              <Text style={styles.listLabel}>My Lists</Text>
              <TouchableOpacity 
                style={styles.listHeaderButton}
                onPress={handleOpenCreateListModal}
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
                    onPress={() => setSelectedList(list)}
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
                <TouchableOpacity style={styles.addListCard}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.addListText}>New List</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Search Bar */}
            <GrocerySearchBar
              items={mockGroceriesDB}
              onSelectItem={handleSelectGroceryItem}
              onQuickAddItem={handleQuickAddItem}
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
                  onDelete={() => handleDeleteItem(item.id)}
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
                        onPress={() => handleQuantityChange(item.id, -1)}
                      >
                        <Text style={styles.quantityBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => handleQuantityChange(item.id, 1)}
                      >
                        <Text style={styles.quantityBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </SwipeableShoppingItem>
              ))}
            </View>
          </View>

          {/* Right Column - Discovery */}
          <View style={styles.rightColumn}>
            {/* Categories Section */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <TouchableOpacity onPress={handleOpenAllItemsModal}>
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoriesGrid}>
                {mockCategories.map((category) => (
                  <TouchableOpacity 
                    key={category.id} 
                    style={styles.categoryTile}
                    onPress={() => handleCategoryClick(category.name)}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={{ uri: category.image }}
                      style={styles.categoryBg}
                      imageStyle={styles.categoryBgImage}
                    >
                      <View style={[styles.categoryOverlay, { backgroundColor: category.backgroundColor }]}>
                        <Text style={styles.categoryCount}>{category.itemCount}</Text>
                        <Text style={styles.categoryName}>{category.name}</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Quantity Modal */}
      <CenteredModal
        visible={showQuantityModal}
        onClose={handleCancelQuantityModal}
        title={`Add to ${selectedList.name}`}
        confirmText="Add to List"
        onConfirm={handleAddToList}
        confirmColor={selectedList.color}
      >
        {selectedGroceryItem && (
          <>
            <View style={styles.modalItemDisplay}>
              <Image 
                source={{ uri: selectedGroceryItem.image }} 
                style={styles.modalItemImage} 
              />
              <View style={styles.modalItemInfo}>
                <Text style={styles.modalItemName}>{selectedGroceryItem.name}</Text>
                <Text style={styles.modalItemCategory}>{selectedGroceryItem.category}</Text>
              </View>
            </View>

            <View style={styles.modalQuantitySection}>
              <Text style={styles.modalQuantityLabel}>Quantity</Text>
              <View style={styles.modalQuantityControls}>
                <TouchableOpacity
                  style={styles.modalQuantityBtn}
                  onPress={() => handleQuantityInputChange(-1)}
                >
                  <Ionicons name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.modalQuantityInput}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.modalQuantityBtn}
                  onPress={() => handleQuantityInputChange(1)}
                >
                  <Ionicons name="add" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </CenteredModal>

      {/* Create List Modal */}
      <CenteredModal
        visible={showCreateListModal}
        onClose={handleCancelCreateListModal}
        title="Create New List"
        confirmText="Create"
        onConfirm={handleCreateList}
        confirmColor={colors.chores}
        confirmDisabled={!newListName.trim()}
      >
        <View style={styles.createListInputSection}>
                  <Text style={styles.createListLabel}>List Name</Text>
                  <TextInput
                    style={styles.createListInput}
                    placeholder="Enter list name..."
                    placeholderTextColor={colors.textMuted}
                    value={newListName}
                    onChangeText={setNewListName}
                    autoFocus
                  />
                </View>

                <View style={styles.createListIconSection}>
                  <Text style={styles.createListLabel}>Icon</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.iconPickerContent}
                  >
                    {(['cart-outline', 'gift-outline', 'restaurant-outline', 'cube-outline', 'nutrition-outline', 'heart-outline', 'home-outline', 'star-outline'] as const).map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconOption,
                          newListIcon === icon && styles.iconOptionActive
                        ]}
                        onPress={() => setNewListIcon(icon)}
                      >
                        <Ionicons name={icon} size={24} color={newListIcon === icon ? colors.chores : colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.createListColorSection}>
                  <Text style={styles.createListLabel}>Color</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorPickerContent}
                  >
                    {['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#F97316', '#14B8A6'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newListColor === color && styles.colorOptionActive
                        ]}
                        onPress={() => setNewListColor(color)}
                      >
                        {newListColor === color && (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
      </CenteredModal>

      {/* Category Modal */}
      <CategoryModal
        visible={showCategoryModal}
        categoryName={selectedCategory}
        items={getCategoryItems(selectedCategory)}
        onClose={handleCloseCategoryModal}
        onSelectItem={handleSelectItemFromCategory}
      />

      {/* All Items Modal */}
      <AllItemsModal
        visible={showAllItemsModal}
        items={mockGroceriesDB}
        onClose={handleCloseAllItemsModal}
        onSelectItem={handleSelectItemFromAllItems}
        onQuickAddItem={handleQuickAddItemFromAllItems}
      />

        {/* Quick Add Button */}
        <FloatingActionButton
          label="Quick Add"
          onPress={handleQuickAdd}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listsDrawer: {
    marginBottom: 16,
  },
  listsDrawerContent: {
    gap: 12,
    paddingVertical: 4,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    minWidth: 180,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.lg,
  },
  listCardActive: {
    borderColor: colors.chores,
    backgroundColor: '#FAFAFA',
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCardContent: {
    flex: 1,
  },
  listCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listCardNameActive: {
    color: colors.chores,
  },
  listCardCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  listCardIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    position: 'absolute',
    right: 0,
  },
  addListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    minWidth: 140,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addListText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.quantityBg,
  },
  itemDetails: {
    flex: 1,
    minWidth: 80,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 13,
    color: colors.textMuted,
  },
  categoriesSection: {
    flex: 1,
    paddingVertical: 11,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.md,
  },
  categoryBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryBgImage: {
    borderRadius: 16,
  },
  categoryOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    borderRadius: 16,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Modal Styles
  modalItemDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalItemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.quantityBg,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalItemCategory: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalQuantitySection: {
    marginBottom: 0,
  },
  modalQuantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  modalQuantityBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalQuantityInput: {
    width: 80,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  createListInputSection: {
    marginBottom: 24,
  },
  createListLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  createListInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  createListIconSection: {
    marginBottom: 24,
  },
  iconPickerContent: {
    gap: 12,
    paddingVertical: 4,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionActive: {
    borderColor: colors.chores,
    backgroundColor: colors.chores + '10',
  },
  createListColorSection: {
    marginBottom: 24,
  },
  colorPickerContent: {
    gap: 12,
    paddingVertical: 4,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: colors.textPrimary,
  },
});
