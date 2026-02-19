import type { BaseEntity } from '../../common/types/entityMetadata';

/**
 * Ingredient sub-entity within a recipe.
 * Note: Does not extend BaseEntity as it's a nested entity, not a top-level domain entity.
 */
export interface Ingredient {
  name: string;
  quantityAmount?: number;
  quantityUnit?: string;
  quantityUnitType?: string;
  quantityModifier?: string;
  /** @deprecated Use quantityAmount */
  quantity?: number;
  /** @deprecated Use quantityUnit */
  unit?: string;
  id?: string; // Optional for legacy/mock data
  image?: string; // Optional image URL for the ingredient
}

/**
 * Instruction sub-entity within a recipe.
 * Note: Does not extend BaseEntity as it's a nested entity, not a top-level domain entity.
 */
export interface Instruction {
  step?: number;
  instruction: string;
  id?: string; // Optional for legacy/mock data
}

/**
 * Recipe entity - top-level domain entity with full metadata.
 */
export interface Recipe extends BaseEntity {
  title: string;
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes (optional; may come from API)
  category?: string;
  imageUrl?: string | null;
  thumbUrl?: string;
  imageVersion?: number;
  imageUpdatedAt?: string;
  description?: string;
  calories?: number;
  servings?: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
}

const mockRecipesRaw: Recipe[] = [
  {
    id: '1',
    localId: '550e8400-e29b-41d4-a716-446655440100', // Stable UUID
    title: 'Pancakes',
    prepTime: 10,
    category: 'Breakfast',
    description: 'Light, fluffy homemade pancakes topped with fresh berries and maple syrup. A classic breakfast favorite.',
    calories: 320,
    servings: 4,
    ingredients: [
      { id: '1-1', quantity: 2, unit: 'cups', name: 'All-purpose Flour', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100' },
      { id: '1-2', quantity: 2, unit: 'tsp', name: 'Baking Powder', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100' },
      { id: '1-3', quantity: 1.5, unit: 'cups', name: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100' },
      { id: '1-4', quantity: 2, unit: 'pcs', name: 'Large Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100' },
      { id: '1-5', quantity: 1, unit: 'cup', name: 'Mixed Berries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100' },
      { id: '1-6', quantity: 0.5, unit: 'cup', name: 'Maple Syrup', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784210?w=100' },
      { id: '1-7', quantity: 3, unit: 'tbsp', name: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100' },
    ],
    instructions: [
      { id: '1-s1', instruction: 'Whisk together the dry ingredients in a large mixing bowl.' },
      { id: '1-s2', instruction: 'In a separate jug, beat the eggs and combine with milk and melted butter.' },
      { id: '1-s3', instruction: 'Combine wet and dry ingredients slowly until just incorporated.' },
      { id: '1-s4', instruction: 'Gently fold in half of the berries to maintain the texture.' },
      { id: '1-s5', instruction: 'Heat a lightly greased griddle to medium-high heat.' },
      { id: '1-s6', instruction: 'Cook until bubbles form on top, then flip and brown the other side.' },
    ],
  },
  {
    id: '2',
    localId: '550e8400-e29b-41d4-a716-446655440101',
    title: 'Pasta Carbonara',
    prepTime: 15,
    category: 'Dinner',
    description: 'Creamy Italian pasta with crispy pancetta, eggs, and parmesan cheese. Rich and satisfying.',
    calories: 550,
    servings: 4,
    ingredients: [
      { id: '2-1', quantity: 400, unit: 'g', name: 'Spaghetti', image: 'https://images.unsplash.com/photo-1551462147-37cbd8c6c4c8?w=100' },
      { id: '2-2', quantity: 200, unit: 'g', name: 'Pancetta', image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=100' },
      { id: '2-3', quantity: 4, unit: 'pcs', name: 'Large Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100' },
      { id: '2-4', quantity: 1, unit: 'cup', name: 'Parmesan Cheese', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=100' },
      { id: '2-5', quantity: 2, unit: 'cloves', name: 'Garlic', image: 'https://images.unsplash.com/photo-1588076367657-3f8e1a8c1c6a?w=100' },
      { id: '2-6', quantity: 2, unit: 'tbsp', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100' },
      { id: '2-7', quantity: 1, unit: 'tsp', name: 'Black Pepper', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100' },
    ],
    instructions: [
      { id: '2-s1', instruction: 'Bring a large pot of salted water to boil and cook spaghetti until al dente.' },
      { id: '2-s2', instruction: 'While pasta cooks, cut pancetta into small cubes.' },
      { id: '2-s3', instruction: 'In a bowl, whisk eggs with grated parmesan and black pepper.' },
      { id: '2-s4', instruction: 'Fry pancetta in olive oil until crispy, add minced garlic for 30 seconds.' },
      { id: '2-s5', instruction: 'Drain pasta, reserving 1 cup of pasta water.' },
      { id: '2-s6', instruction: 'Toss hot pasta with pancetta, remove from heat, quickly stir in egg mixture.' },
      { id: '2-s7', instruction: 'Add pasta water as needed for creamy consistency. Serve immediately.' },
    ],
  },
  {
    id: '3',
    localId: '550e8400-e29b-41d4-a716-446655440102',
    title: 'Caesar Salad',
    prepTime: 10,
    category: 'Lunch',
    description: 'Fresh romaine lettuce with homemade Caesar dressing, crunchy croutons, and shaved parmesan.',
    calories: 280,
    servings: 2,
    ingredients: [
      { id: '3-1', quantity: 1, unit: 'head', name: 'Romaine Lettuce', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100' },
      { id: '3-2', quantity: 0.5, unit: 'cup', name: 'Parmesan Cheese', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=100' },
      { id: '3-3', quantity: 1, unit: 'cup', name: 'Croutons', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100' },
      { id: '3-4', quantity: 2, unit: 'cloves', name: 'Garlic', image: 'https://images.unsplash.com/photo-1588076367657-3f8e1a8c1c6a?w=100' },
      { id: '3-5', quantity: 2, unit: 'tbsp', name: 'Lemon Juice', image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=100' },
      { id: '3-6', quantity: 1, unit: 'tsp', name: 'Dijon Mustard', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100' },
      { id: '3-7', quantity: 0.5, unit: 'cup', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100' },
      { id: '3-8', quantity: 2, unit: 'fillets', name: 'Anchovy', image: 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=100' },
    ],
    instructions: [
      { id: '3-s1', instruction: 'Wash and dry romaine lettuce, tear into bite-sized pieces.' },
      { id: '3-s2', instruction: 'Make dressing: blend garlic, anchovies, mustard, and lemon juice.' },
      { id: '3-s3', instruction: 'Slowly drizzle in olive oil while blending until emulsified.' },
      { id: '3-s4', instruction: 'Toss lettuce with dressing until evenly coated.' },
      { id: '3-s5', instruction: 'Top with croutons and shaved parmesan. Serve immediately.' },
    ],
  },
  {
    id: '4',
    localId: '550e8400-e29b-41d4-a716-446655440103',
    title: 'Tomato Soup',
    prepTime: 15,
    category: 'Lunch',
    description: 'Velvety smooth tomato soup made with roasted tomatoes and fresh basil. Comfort in a bowl.',
    calories: 180,
    servings: 6,
    ingredients: [
      { id: '4-1', quantity: 2, unit: 'lbs', name: 'Roma Tomatoes', image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=100' },
      { id: '4-2', quantity: 1, unit: 'medium', name: 'Onion', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100' },
      { id: '4-3', quantity: 4, unit: 'cloves', name: 'Garlic', image: 'https://images.unsplash.com/photo-1588076367657-3f8e1a8c1c6a?w=100' },
      { id: '4-4', quantity: 2, unit: 'cups', name: 'Vegetable Broth', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100' },
      { id: '4-5', quantity: 0.5, unit: 'cup', name: 'Heavy Cream', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=100' },
      { id: '4-6', quantity: 0.25, unit: 'cup', name: 'Fresh Basil', image: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=100' },
      { id: '4-7', quantity: 2, unit: 'tbsp', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100' },
      { id: '4-8', quantity: 1, unit: 'tsp', name: 'Sugar', image: 'https://images.unsplash.com/photo-1514692547262-0c80a6d52c3f?w=100' },
    ],
    instructions: [
      { id: '4-s1', instruction: 'Preheat oven to 400°F. Halve tomatoes and place on baking sheet.' },
      { id: '4-s2', instruction: 'Add quartered onion and garlic cloves, drizzle with olive oil.' },
      { id: '4-s3', instruction: 'Roast for 30 minutes until tomatoes are caramelized.' },
      { id: '4-s4', instruction: 'Transfer roasted vegetables to a pot, add broth and sugar.' },
      { id: '4-s5', instruction: 'Simmer for 10 minutes, then blend until smooth.' },
      { id: '4-s6', instruction: 'Stir in cream and fresh basil. Season to taste and serve.' },
    ],
  },
  {
    id: '5',
    localId: '550e8400-e29b-41d4-a716-446655440104',
    title: 'Grilled Chicken',
    prepTime: 20,
    category: 'Dinner',
    description: 'Juicy herb-marinated grilled chicken breast with a perfect char. High protein and delicious.',
    calories: 380,
    servings: 4,
    ingredients: [
      { id: '5-1', quantity: 4, unit: 'pcs', name: 'Chicken Breast', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100' },
      { id: '5-2', quantity: 3, unit: 'tbsp', name: 'Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100' },
      { id: '5-3', quantity: 2, unit: 'tbsp', name: 'Lemon Juice', image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=100' },
      { id: '5-4', quantity: 3, unit: 'cloves', name: 'Garlic', image: 'https://images.unsplash.com/photo-1588076367657-3f8e1a8c1c6a?w=100' },
      { id: '5-5', quantity: 1, unit: 'tsp', name: 'Dried Oregano', image: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=100' },
      { id: '5-6', quantity: 1, unit: 'tsp', name: 'Dried Thyme', image: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=100' },
      { id: '5-7', quantity: 1, unit: 'tsp', name: 'Paprika', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100' },
      { id: '5-8', quantity: 0.5, unit: 'tsp', name: 'Salt', image: 'https://images.unsplash.com/photo-1614189146146-a99bc1d79ec7?w=100' },
    ],
    instructions: [
      { id: '5-s1', instruction: 'Pound chicken breasts to even thickness for uniform cooking.' },
      { id: '5-s2', instruction: 'Mix olive oil, lemon juice, minced garlic, and all herbs in a bowl.' },
      { id: '5-s3', instruction: 'Marinate chicken in the mixture for at least 30 minutes.' },
      { id: '5-s4', instruction: 'Preheat grill to medium-high heat and oil the grates.' },
      { id: '5-s5', instruction: 'Grill chicken 6-7 minutes per side until internal temp reaches 165°F.' },
      { id: '5-s6', instruction: 'Let rest for 5 minutes before slicing. Serve with vegetables.' },
    ],
  },
  {
    id: '6',
    localId: '550e8400-e29b-41d4-a716-446655440105',
    title: 'French Toast',
    prepTime: 10,
    category: 'Breakfast',
    description: 'Golden, custard-soaked bread slices with a hint of cinnamon and vanilla. Weekend brunch perfection.',
    calories: 350,
    servings: 4,
    ingredients: [
      { id: '6-1', quantity: 8, unit: 'slices', name: 'Brioche Bread', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100' },
      { id: '6-2', quantity: 4, unit: 'pcs', name: 'Large Eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100' },
      { id: '6-3', quantity: 1, unit: 'cup', name: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100' },
      { id: '6-4', quantity: 1, unit: 'tsp', name: 'Vanilla Extract', image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc4d23?w=100' },
      { id: '6-5', quantity: 1, unit: 'tsp', name: 'Cinnamon', image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100' },
      { id: '6-6', quantity: 2, unit: 'tbsp', name: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100' },
      { id: '6-7', quantity: 0.25, unit: 'cup', name: 'Powdered Sugar', image: 'https://images.unsplash.com/photo-1514692547262-0c80a6d52c3f?w=100' },
    ],
    instructions: [
      { id: '6-s1', instruction: 'Whisk eggs, milk, vanilla, and cinnamon in a shallow dish.' },
      { id: '6-s2', instruction: 'Heat butter in a large skillet over medium heat.' },
      { id: '6-s3', instruction: 'Dip each bread slice in egg mixture, coating both sides.' },
      { id: '6-s4', instruction: 'Cook until golden brown, about 2-3 minutes per side.' },
      { id: '6-s5', instruction: 'Dust with powdered sugar and serve with fresh fruit or syrup.' },
    ],
  },
];

const normalizeMockIngredients = (ingredients: Ingredient[]): Ingredient[] =>
  ingredients.map((ing) => ({
    ...ing,
    quantityAmount: ing.quantityAmount ?? ing.quantity,
    quantityUnit: ing.quantityUnit ?? ing.unit,
  }));

const normalizeMockInstructions = (instructions: Instruction[]): Instruction[] =>
  instructions.map((inst, index) => ({
    ...inst,
    step: inst.step ?? index + 1,
  }));

export const mockRecipes: Recipe[] = mockRecipesRaw.map((recipe) => ({
  ...recipe,
  ingredients: normalizeMockIngredients(recipe.ingredients),
  instructions: normalizeMockInstructions(recipe.instructions),
}));

export const recipeCategories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Other'];
