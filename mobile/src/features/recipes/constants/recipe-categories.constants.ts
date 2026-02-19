export const RECIPE_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Dessert',
  'Other',
] as const;

export const RECIPE_FILTER_CATEGORIES = ['All', ...RECIPE_CATEGORIES] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
export type RecipeFilterCategory = (typeof RECIPE_FILTER_CATEGORIES)[number];

const RECIPE_CATEGORY_ALIASES: Record<string, RecipeCategory> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  snacks: 'Snacks',
  dessert: 'Dessert',
  other: 'Other',
};

const RECIPE_CATEGORY_ICONS: Record<RecipeFilterCategory, string> = {
  All: 'apps-outline',
  Breakfast: 'cafe-outline',
  Lunch: 'sunny-outline',
  Dinner: 'restaurant-outline',
  Snacks: 'nutrition-outline',
  Dessert: 'ice-cream-outline',
  Other: 'bookmark-outline',
};

export function normalizeRecipeCategory(category: string | null | undefined): RecipeCategory {
  if (!category || typeof category !== 'string') {
    return 'Other';
  }

  const normalized = category.trim().toLowerCase();
  return RECIPE_CATEGORY_ALIASES[normalized] ?? 'Other';
}

export function getRecipeCategoryIcon(category: string): string {
  if (category === 'All') {
    return RECIPE_CATEGORY_ICONS.All;
  }

  const normalizedCategory = normalizeRecipeCategory(category);
  return RECIPE_CATEGORY_ICONS[normalizedCategory];
}
