export interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}

export const mockRecipes: Recipe[] = [
  { id: '1', name: 'Pancakes', cookTime: '20 min', category: 'Breakfast' },
  { id: '2', name: 'Pasta Carbonara', cookTime: '30 min', category: 'Dinner' },
  { id: '3', name: 'Caesar Salad', cookTime: '15 min', category: 'Lunch' },
  { id: '4', name: 'Tomato Soup', cookTime: '45 min', category: 'Lunch' },
  { id: '5', name: 'Grilled Chicken', cookTime: '35 min', category: 'Dinner' },
  { id: '6', name: 'French Toast', cookTime: '15 min', category: 'Breakfast' },
];

export const recipeCategories = ['All', 'Breakfast', 'Lunch', 'Dinner'];
