import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BaseEntity } from '../../common/types/entityMetadata';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// Types
export interface ShoppingItem extends BaseEntity {
  name: string;
  image: string;
  quantity: number;
  unit?: string;
  category: string;
  listId: string;
  isChecked: boolean;
}

export interface Category extends BaseEntity {
  name: string;
  itemCount: number;
  image: string;
  backgroundColor: string;
}

export interface ShoppingList extends BaseEntity {
  name: string;
  itemCount: number;
  icon: IoniconsName;
  color: string;
}

// Mock Data
export const mockItems: ShoppingItem[] = [
  // Weekly Groceries (list 1)
  { id: '1', localId: '550e8400-e29b-41d4-a716-446655440000', name: 'Banana', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100', quantity: 6, category: 'Fruits', listId: '1', isChecked: false },
  { id: '2', localId: '550e8400-e29b-41d4-a716-446655440001', name: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100', quantity: 2, category: 'Dairy', listId: '1', isChecked: false },
  { id: '3', localId: '550e8400-e29b-41d4-a716-446655440002', name: 'Bread', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100', quantity: 1, category: 'Bakery', listId: '1', isChecked: false },
  { id: '4', localId: '550e8400-e29b-41d4-a716-446655440003', name: 'Chicken Breast', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100', quantity: 3, category: 'Meat', listId: '1', isChecked: false },
  { id: '5', localId: '550e8400-e29b-41d4-a716-446655440004', name: 'Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100', quantity: 12, category: 'Dairy', listId: '1', isChecked: false },
  { id: '6', localId: '550e8400-e29b-41d4-a716-446655440005', name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=100', quantity: 4, category: 'Vegetables', listId: '1', isChecked: false },

  // Party Supplies (list 2)
  { id: '7', localId: '550e8400-e29b-41d4-a716-446655440006', name: 'Chips', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100', quantity: 5, category: 'Snacks', listId: '2', isChecked: false },
  { id: '8', localId: '550e8400-e29b-41d4-a716-446655440007', name: 'Soda', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100', quantity: 8, category: 'Beverages', listId: '2', isChecked: false },
  { id: '9', localId: '550e8400-e29b-41d4-a716-446655440008', name: 'Party Cups', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100', quantity: 50, category: 'Supplies', listId: '2', isChecked: false },
  { id: '10', localId: '550e8400-e29b-41d4-a716-446655440009', name: 'Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100', quantity: 1, category: 'Sweets', listId: '2', isChecked: false },
  { id: '11', localId: '550e8400-e29b-41d4-a716-446655440010', name: 'Ice Cream', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100', quantity: 3, category: 'Freezer', listId: '2', isChecked: false },

  // Meal Prep (list 3)
  { id: '12', localId: '550e8400-e29b-41d4-a716-446655440011', name: 'Brown Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', quantity: 2, category: 'Grains', listId: '3', isChecked: false },
  { id: '13', localId: '550e8400-e29b-41d4-a716-446655440012', name: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100', quantity: 3, category: 'Vegetables', listId: '3', isChecked: false },
  { id: '14', localId: '550e8400-e29b-41d4-a716-446655440013', name: 'Salmon', image: 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=100', quantity: 4, category: 'Seafood', listId: '3', isChecked: false },
  { id: '15', localId: '550e8400-e29b-41d4-a716-446655440014', name: 'Sweet Potato', image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=100', quantity: 6, category: 'Vegetables', listId: '3', isChecked: false },
  { id: '16', localId: '550e8400-e29b-41d4-a716-446655440015', name: 'Greek Yogurt', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100', quantity: 5, category: 'Dairy', listId: '3', isChecked: false },

  // Pantry Restock (list 4)
  { id: '17', localId: '550e8400-e29b-41d4-a716-446655440016', name: 'Pasta', image: 'https://images.unsplash.com/photo-1551462147-37cbd8c6c4c8?w=100', quantity: 4, category: 'Grains', listId: '4', isChecked: false },
  { id: '18', localId: '550e8400-e29b-41d4-a716-446655440017', name: 'Canned Beans', image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=100', quantity: 6, category: 'Canned', listId: '4', isChecked: false },
  { id: '19', localId: '550e8400-e29b-41d4-a716-446655440018', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100', quantity: 1, category: 'Oils', listId: '4', isChecked: false },
  { id: '20', localId: '550e8400-e29b-41d4-a716-446655440019', name: 'Flour', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100', quantity: 2, category: 'Baking', listId: '4', isChecked: false },

  // Healthy Snacks (list 5)
  { id: '21', localId: '550e8400-e29b-41d4-a716-446655440020', name: 'Almonds', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=100', quantity: 2, category: 'Nuts', listId: '5', isChecked: false },
  { id: '22', localId: '550e8400-e29b-41d4-a716-446655440021', name: 'Protein Bars', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100', quantity: 12, category: 'Snacks', listId: '5', isChecked: false },
  { id: '23', localId: '550e8400-e29b-41d4-a716-446655440022', name: 'Hummus', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=100', quantity: 3, category: 'Dips', listId: '5', isChecked: false },
  { id: '24', localId: '550e8400-e29b-41d4-a716-446655440023', name: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=100', quantity: 1, category: 'Vegetables', listId: '5', isChecked: false },
];

export const mockCategories: Category[] = [
  { id: '1', localId: '550e8400-e29b-41d4-a716-446655440150', name: 'Sweets', itemCount: 12, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', backgroundColor: 'rgba(255, 182, 193, 0.85)' },
  { id: '2', localId: '550e8400-e29b-41d4-a716-446655440151', name: 'Freezer', itemCount: 18, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200', backgroundColor: 'rgba(173, 216, 230, 0.85)' },
  { id: '3', localId: '550e8400-e29b-41d4-a716-446655440152', name: 'Meat', itemCount: 43, image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200', backgroundColor: 'rgba(210, 180, 140, 0.85)' },
  { id: '4', localId: '550e8400-e29b-41d4-a716-446655440153', name: 'Snacks', itemCount: 89, image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200', backgroundColor: 'rgba(255, 218, 185, 0.85)' },
  { id: '5', localId: '550e8400-e29b-41d4-a716-446655440154', name: 'Dairy', itemCount: 45, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200', backgroundColor: 'rgba(255, 250, 205, 0.85)' },
  { id: '6', localId: '550e8400-e29b-41d4-a716-446655440155', name: 'Beverages', itemCount: 67, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200', backgroundColor: 'rgba(144, 238, 144, 0.85)' },
  { id: '7', localId: '550e8400-e29b-41d4-a716-446655440156', name: 'Dips', itemCount: 89, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=200', backgroundColor: 'rgba(255, 160, 122, 0.85)' },
  { id: '8', localId: '550e8400-e29b-41d4-a716-446655440157', name: 'Cheeses', itemCount: 12, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200', backgroundColor: 'rgba(255, 228, 181, 0.85)' },
  { id: '9', localId: '550e8400-e29b-41d4-a716-446655440158', name: 'Teas', itemCount: 34, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', backgroundColor: 'rgba(176, 224, 230, 0.85)' },
];

// Calculate item counts dynamically
export const getListItemCount = (listId: string) => {
  return mockItems.filter(item => item.listId === listId).length;
};

export const mockShoppingLists: ShoppingList[] = [
  { id: '1', localId: '550e8400-e29b-41d4-a716-446655440050', name: 'Weekly Groceries', itemCount: getListItemCount('1'), icon: 'cart-outline', color: '#10B981' },
  { id: '2', localId: '550e8400-e29b-41d4-a716-446655440051', name: 'Party Supplies', itemCount: getListItemCount('2'), icon: 'gift-outline', color: '#F59E0B' },
  { id: '3', localId: '550e8400-e29b-41d4-a716-446655440052', name: 'Meal Prep', itemCount: getListItemCount('3'), icon: 'restaurant-outline', color: '#8B5CF6' },
  { id: '4', localId: '550e8400-e29b-41d4-a716-446655440053', name: 'Pantry Restock', itemCount: getListItemCount('4'), icon: 'cube-outline', color: '#EF4444' },
  { id: '5', localId: '550e8400-e29b-41d4-a716-446655440054', name: 'Healthy Snacks', itemCount: getListItemCount('5'), icon: 'nutrition-outline', color: '#06B6D4' },
];
