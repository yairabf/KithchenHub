import { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import { mockGroceriesDB } from '../../data/groceryDatabase';

// Mock frequently added items (top 8 most commonly added)
// In a real implementation, this would be calculated from user history
export const mockFrequentlyAddedItems: GroceryItem[] = [
  mockGroceriesDB.find(item => item.name === 'Banana'),
  mockGroceriesDB.find(item => item.name === 'Whole Milk'),
  mockGroceriesDB.find(item => item.name === 'Eggs'),
  mockGroceriesDB.find(item => item.name === 'White Bread'),
  mockGroceriesDB.find(item => item.name === 'Chicken Breast'),
  mockGroceriesDB.find(item => item.name === 'Tomatoes'),
  mockGroceriesDB.find(item => item.name === 'Avocado'),
  mockGroceriesDB.find(item => item.name === 'Greek Yogurt'),
].filter((item): item is GroceryItem => item !== undefined);
