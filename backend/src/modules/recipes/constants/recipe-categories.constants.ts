export const RECIPE_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Dessert',
  'Other',
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

const RECIPE_CATEGORY_ALIASES: Record<string, RecipeCategory> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  snacks: 'Snacks',
  dessert: 'Dessert',
  other: 'Other',
};

export function normalizeRecipeCategory(
  category: string | null | undefined,
): RecipeCategory {
  if (!category || typeof category !== 'string') {
    return 'Other';
  }

  const normalized = category.trim().toLowerCase();
  return RECIPE_CATEGORY_ALIASES[normalized] ?? 'Other';
}
