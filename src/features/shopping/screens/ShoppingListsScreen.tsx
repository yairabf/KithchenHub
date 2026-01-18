import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { CategoryModal } from '../components/CategoryModal';
import { AllItemsModal } from '../components/AllItemsModal';
import { ShoppingListPanel } from '../components/ShoppingListPanel';
import { CategoriesGrid } from '../components/CategoriesGrid';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { FloatingActionButton } from '../../../common/components/FloatingActionButton';
import { GrocerySearchBar, GroceryItem } from '../components/GrocerySearchBar';
import { colors } from '../../../theme';
import { styles } from './styles';
import { mockGroceriesDB } from '../../../data/groceryDatabase';
import {
  mockItems,
  mockCategories,
  mockShoppingLists,
  type ShoppingItem,
  type ShoppingList,
} from '../../../mocks/shopping';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

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
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

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
    setShowQuickAddModal(true);
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
          <ShoppingListPanel
            shoppingLists={shoppingLists}
            selectedList={selectedList}
            filteredItems={filteredItems}
            onSelectList={setSelectedList}
            onCreateList={handleOpenCreateListModal}
            onSelectGroceryItem={handleSelectGroceryItem}
            onQuickAddItem={handleQuickAddItem}
            onQuantityChange={handleQuantityChange}
            onDeleteItem={handleDeleteItem}
          />

          {/* Right Column - Discovery */}
          <View style={styles.rightColumn}>
            <CategoriesGrid
              categories={mockCategories}
              onCategoryPress={handleCategoryClick}
              onSeeAllPress={handleOpenAllItemsModal}
            />
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

      {/* Quick Add Modal */}
      <CenteredModal
        visible={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        title="Quick Add"
        showActions={false}
      >
        <View>
          {/* List Switcher */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickAddListSwitcher}
            contentContainerStyle={styles.quickAddListSwitcherContent}
          >
            {shoppingLists.map(list => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.quickAddListBubble,
                  selectedList.id === list.id && { backgroundColor: list.color },
                ]}
                onPress={() => setSelectedList(list)}
              >
                <Text
                  style={[
                    styles.quickAddListBubbleText,
                    selectedList.id === list.id && { color: colors.textLight },
                  ]}
                >
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Bar */}
          <GrocerySearchBar
            items={mockGroceriesDB}
            onSelectItem={(item) => {
              setShowQuickAddModal(false);
              handleSelectGroceryItem(item);
            }}
            onQuickAddItem={handleQuickAddItem}
            variant="background"
            showShadow={false}
            allowCustomItems={true}
          />
        </View>
      </CenteredModal>

        {/* Quick Add Button */}
        <FloatingActionButton
          label="Quick Add"
          onPress={handleQuickAdd}
        />
      </SafeAreaView>
  );
}
