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
import { CategoryModal } from '../../components/shopping/CategoryModal';
import { AllItemsModal } from '../../components/shopping/AllItemsModal';
import { SwipeableShoppingItem } from '../../components/shopping/SwipeableShoppingItem';
import { CenteredModal } from '../../components/common/CenteredModal';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { GrocerySearchBar, GroceryItem } from '../../components/common/GrocerySearchBar';
import { colors, spacing, borderRadius, typography, shadows, componentSize } from '../../theme';

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
  icon: string;
  color: string;
}

// Mock Groceries Database - Available items to search and add
// Organized for easy manual testing with various search scenarios
const mockGroceriesDB: GroceryItem[] = [
  // === FRUITS (Test: "apple", "ban", "berry", "fruits") ===
  { id: 'g1', name: 'Banana', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100', category: 'Fruits', defaultQuantity: 6 },
  { id: 'g2', name: 'Apple', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100', category: 'Fruits', defaultQuantity: 4 },
  { id: 'g3', name: 'Green Apple', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100', category: 'Fruits', defaultQuantity: 4 },
  { id: 'g4', name: 'Orange', image: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=100', category: 'Fruits', defaultQuantity: 5 },
  { id: 'g5', name: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g6', name: 'Blueberries', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g7', name: 'Raspberries', image: 'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g8', name: 'Grapes', image: 'https://images.unsplash.com/photo-1599819177331-6d6e0b9e5d0e?w=100', category: 'Fruits', defaultQuantity: 1 },
  { id: 'g9', name: 'Watermelon', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784210?w=100', category: 'Fruits', defaultQuantity: 1 },
  { id: 'g10', name: 'Mango', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=100', category: 'Fruits', defaultQuantity: 2 },
  { id: 'g11', name: 'Pineapple', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=100', category: 'Fruits', defaultQuantity: 1 },
  { id: 'g12', name: 'Avocado', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100', category: 'Fruits', defaultQuantity: 3 },
  
  // === VEGETABLES (Test: "tom", "carr", "pot", "vegetables") ===
  { id: 'g13', name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=100', category: 'Vegetables', defaultQuantity: 4 },
  { id: 'g14', name: 'Cherry Tomatoes', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100', category: 'Vegetables', defaultQuantity: 2 },
  { id: 'g15', name: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100', category: 'Vegetables', defaultQuantity: 2 },
  { id: 'g16', name: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g17', name: 'Baby Carrots', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g18', name: 'Lettuce', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g19', name: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100', category: 'Vegetables', defaultQuantity: 1 },
  { id: 'g20', name: 'Sweet Potato', image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=100', category: 'Vegetables', defaultQuantity: 3 },
  { id: 'g21', name: 'Regular Potato', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100', category: 'Vegetables', defaultQuantity: 5 },
  { id: 'g22', name: 'Bell Pepper', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=100', category: 'Vegetables', defaultQuantity: 3 },
  { id: 'g23', name: 'Red Bell Pepper', image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=100', category: 'Vegetables', defaultQuantity: 2 },
  { id: 'g24', name: 'Cucumber', image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=100', category: 'Vegetables', defaultQuantity: 2 },
  { id: 'g25', name: 'Onion', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100', category: 'Vegetables', defaultQuantity: 3 },
  { id: 'g26', name: 'Garlic', image: 'https://images.unsplash.com/photo-1588076367657-3f8e1a8c1c6a?w=100', category: 'Vegetables', defaultQuantity: 1 },
  
  // === DAIRY (Test: "milk", "cheese", "yogurt", "dairy") ===
  { id: 'g27', name: 'Whole Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100', category: 'Dairy', defaultQuantity: 2 },
  { id: 'g28', name: 'Almond Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g29', name: 'Oat Milk', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g30', name: 'Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100', category: 'Dairy', defaultQuantity: 12 },
  { id: 'g31', name: 'Greek Yogurt', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100', category: 'Dairy', defaultQuantity: 4 },
  { id: 'g32', name: 'Plain Yogurt', image: 'https://images.unsplash.com/photo-1571212515416-fca2ce2c089c?w=100', category: 'Dairy', defaultQuantity: 3 },
  { id: 'g33', name: 'Cheddar Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g34', name: 'Mozzarella Cheese', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g35', name: 'Parmesan Cheese', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g36', name: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g37', name: 'Cream Cheese', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=100', category: 'Dairy', defaultQuantity: 1 },
  { id: 'g38', name: 'Sour Cream', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=100', category: 'Dairy', defaultQuantity: 1 },
  
  // === MEAT & SEAFOOD (Test: "chicken", "beef", "fish", "meat", "seafood") ===
  { id: 'g39', name: 'Chicken Breast', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100', category: 'Meat', defaultQuantity: 2 },
  { id: 'g40', name: 'Chicken Thighs', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100', category: 'Meat', defaultQuantity: 4 },
  { id: 'g41', name: 'Ground Beef', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=100', category: 'Meat', defaultQuantity: 1 },
  { id: 'g42', name: 'Steak', image: 'https://images.unsplash.com/photo-1588347818036-4c0b583c3266?w=100', category: 'Meat', defaultQuantity: 2 },
  { id: 'g43', name: 'Ground Turkey', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=100', category: 'Meat', defaultQuantity: 1 },
  { id: 'g44', name: 'Salmon', image: 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=100', category: 'Seafood', defaultQuantity: 2 },
  { id: 'g45', name: 'Tuna', image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=100', category: 'Seafood', defaultQuantity: 2 },
  { id: 'g46', name: 'Shrimp', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=100', category: 'Seafood', defaultQuantity: 1 },
  { id: 'g47', name: 'Bacon', image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=100', category: 'Meat', defaultQuantity: 1 },
  { id: 'g48', name: 'Sausage', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=100', category: 'Meat', defaultQuantity: 1 },
  
  // === BAKERY & GRAINS (Test: "bread", "rice", "pasta", "bakery", "grains") ===
  { id: 'g49', name: 'White Bread', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100', category: 'Bakery', defaultQuantity: 1 },
  { id: 'g50', name: 'Whole Wheat Bread', image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=100', category: 'Bakery', defaultQuantity: 1 },
  { id: 'g51', name: 'Bagels', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100', category: 'Bakery', defaultQuantity: 6 },
  { id: 'g52', name: 'Croissants', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100', category: 'Bakery', defaultQuantity: 4 },
  { id: 'g53', name: 'White Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', category: 'Grains', defaultQuantity: 1 },
  { id: 'g54', name: 'Brown Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', category: 'Grains', defaultQuantity: 1 },
  { id: 'g55', name: 'Spaghetti Pasta', image: 'https://images.unsplash.com/photo-1551462147-37cbd8c6c4c8?w=100', category: 'Grains', defaultQuantity: 2 },
  { id: 'g56', name: 'Penne Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=100', category: 'Grains', defaultQuantity: 2 },
  { id: 'g57', name: 'Quinoa', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', category: 'Grains', defaultQuantity: 1 },
  { id: 'g58', name: 'Oatmeal', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=100', category: 'Grains', defaultQuantity: 1 },
  
  // === SNACKS (Test: "chip", "nut", "bar", "snacks") ===
  { id: 'g59', name: 'Potato Chips', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100', category: 'Snacks', defaultQuantity: 2 },
  { id: 'g60', name: 'Tortilla Chips', image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=100', category: 'Snacks', defaultQuantity: 2 },
  { id: 'g61', name: 'Almonds', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=100', category: 'Nuts', defaultQuantity: 1 },
  { id: 'g62', name: 'Cashews', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=100', category: 'Nuts', defaultQuantity: 1 },
  { id: 'g63', name: 'Peanuts', image: 'https://images.unsplash.com/photo-1582054593708-1fb1f5e7c4b7?w=100', category: 'Nuts', defaultQuantity: 1 },
  { id: 'g64', name: 'Protein Bars', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Snacks', defaultQuantity: 6 },
  { id: 'g65', name: 'Granola Bars', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Snacks', defaultQuantity: 6 },
  { id: 'g66', name: 'Crackers', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100', category: 'Snacks', defaultQuantity: 1 },
  { id: 'g67', name: 'Pretzels', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=100', category: 'Snacks', defaultQuantity: 1 },
  { id: 'g68', name: 'Popcorn', image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=100', category: 'Snacks', defaultQuantity: 2 },
  
  // === BEVERAGES (Test: "juice", "coffee", "tea", "beverages") ===
  { id: 'g69', name: 'Coca Cola', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100', category: 'Beverages', defaultQuantity: 6 },
  { id: 'g70', name: 'Sprite', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=100', category: 'Beverages', defaultQuantity: 6 },
  { id: 'g71', name: 'Orange Juice', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100', category: 'Beverages', defaultQuantity: 1 },
  { id: 'g72', name: 'Apple Juice', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100', category: 'Beverages', defaultQuantity: 1 },
  { id: 'g73', name: 'Cranberry Juice', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100', category: 'Beverages', defaultQuantity: 1 },
  { id: 'g74', name: 'Coffee Beans', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=100', category: 'Beverages', defaultQuantity: 1 },
  { id: 'g75', name: 'Instant Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=100', category: 'Beverages', defaultQuantity: 1 },
  { id: 'g76', name: 'Green Tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=100', category: 'Teas', defaultQuantity: 1 },
  { id: 'g77', name: 'Black Tea', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100', category: 'Teas', defaultQuantity: 1 },
  { id: 'g78', name: 'Herbal Tea', image: 'https://images.unsplash.com/photo-1597318181390-8a9fed4d0dbb?w=100', category: 'Teas', defaultQuantity: 1 },
  
  // === PANTRY (Test: "oil", "flour", "sugar", "beans", "pantry") ===
  { id: 'g79', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100', category: 'Oils', defaultQuantity: 1 },
  { id: 'g80', name: 'Vegetable Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100', category: 'Oils', defaultQuantity: 1 },
  { id: 'g81', name: 'All-Purpose Flour', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100', category: 'Baking', defaultQuantity: 1 },
  { id: 'g82', name: 'Whole Wheat Flour', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100', category: 'Baking', defaultQuantity: 1 },
  { id: 'g83', name: 'White Sugar', image: 'https://images.unsplash.com/photo-1514692547262-0c80a6d52c3f?w=100', category: 'Baking', defaultQuantity: 1 },
  { id: 'g84', name: 'Brown Sugar', image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=100', category: 'Baking', defaultQuantity: 1 },
  { id: 'g85', name: 'Black Beans', image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=100', category: 'Canned', defaultQuantity: 3 },
  { id: 'g86', name: 'Kidney Beans', image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=100', category: 'Canned', defaultQuantity: 3 },
  { id: 'g87', name: 'Chickpeas', image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=100', category: 'Canned', defaultQuantity: 2 },
  { id: 'g88', name: 'Peanut Butter', image: 'https://images.unsplash.com/photo-1559492554-7133c14d7bce?w=100', category: 'Spreads', defaultQuantity: 1 },
  { id: 'g89', name: 'Almond Butter', image: 'https://images.unsplash.com/photo-1559492554-7133c14d7bce?w=100', category: 'Spreads', defaultQuantity: 1 },
  { id: 'g90', name: 'Honey', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784210?w=100', category: 'Spreads', defaultQuantity: 1 },
  { id: 'g91', name: 'Jam', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=100', category: 'Spreads', defaultQuantity: 1 },
  
  // === FROZEN & SWEETS (Test: "ice", "pizza", "cake", "chocolate", "frozen", "sweets") ===
  { id: 'g92', name: 'Vanilla Ice Cream', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100', category: 'Freezer', defaultQuantity: 1 },
  { id: 'g93', name: 'Chocolate Ice Cream', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100', category: 'Freezer', defaultQuantity: 1 },
  { id: 'g94', name: 'Frozen Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100', category: 'Freezer', defaultQuantity: 2 },
  { id: 'g95', name: 'Frozen Vegetables', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100', category: 'Freezer', defaultQuantity: 3 },
  { id: 'g96', name: 'Chocolate Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100', category: 'Sweets', defaultQuantity: 1 },
  { id: 'g97', name: 'Vanilla Cake', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100', category: 'Sweets', defaultQuantity: 1 },
  { id: 'g98', name: 'Dark Chocolate', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=100', category: 'Sweets', defaultQuantity: 2 },
  { id: 'g99', name: 'Milk Chocolate', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Sweets', defaultQuantity: 2 },
  { id: 'g100', name: 'Cookies', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100', category: 'Sweets', defaultQuantity: 1 },
  { id: 'g101', name: 'Brownies', image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=100', category: 'Sweets', defaultQuantity: 1 },
  
  // === CONDIMENTS & DIPS (Test: "ketchup", "mayo", "salsa", "hummus", "condiments", "dips") ===
  { id: 'g102', name: 'Hummus', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=100', category: 'Dips', defaultQuantity: 1 },
  { id: 'g103', name: 'Guacamole', image: 'https://images.unsplash.com/photo-1604905428313-0c6f5c9d6e2a?w=100', category: 'Dips', defaultQuantity: 1 },
  { id: 'g104', name: 'Salsa', image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=100', category: 'Dips', defaultQuantity: 1 },
  { id: 'g105', name: 'Ranch Dressing', image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=100', category: 'Dips', defaultQuantity: 1 },
  { id: 'g106', name: 'Ketchup', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Condiments', defaultQuantity: 1 },
  { id: 'g107', name: 'Mustard', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Condiments', defaultQuantity: 1 },
  { id: 'g108', name: 'Mayonnaise', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Condiments', defaultQuantity: 1 },
  { id: 'g109', name: 'Soy Sauce', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Condiments', defaultQuantity: 1 },
  { id: 'g110', name: 'Hot Sauce', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Condiments', defaultQuantity: 1 },
  { id: 'g111', name: 'BBQ Sauce', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', category: 'Condiments', defaultQuantity: 1 },
];

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
  const [newListIcon, setNewListIcon] = useState('cart-outline');
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
    console.log('handleOpenAllItemsModal called');
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
                      <Ionicons name={list.icon as any} size={20} color={list.color} />
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
                    {['cart-outline', 'gift-outline', 'restaurant-outline', 'cube-outline', 'nutrition-outline', 'heart-outline', 'home-outline', 'star-outline'].map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconOption,
                          newListIcon === icon && styles.iconOptionActive
                        ]}
                        onPress={() => setNewListIcon(icon)}
                      >
                        <Ionicons name={icon as any} size={24} color={newListIcon === icon ? colors.chores : colors.textSecondary} />
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
    paddingBottom: 120,
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
