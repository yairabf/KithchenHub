import type { ShoppingItem } from '../../../mocks/shopping';
import type { GroceryItem } from '../../shopping/components/GrocerySearchBar';

export function buildDashboardFrequentItems(
  items: ShoppingItem[],
  limit: number,
): GroceryItem[] {
  const rankedItems = new Map<string, { item: GroceryItem; score: number }>();

  items.forEach((item) => {
    const normalizedName = item.name.trim().toLowerCase();
    if (!normalizedName) {
      return;
    }

    const key = item.catalogItemId ?? normalizedName;
    const scoreIncrement = typeof item.quantity === 'number' && item.quantity > 0
      ? item.quantity
      : 1;
    const candidate: GroceryItem = {
      id: item.catalogItemId ?? item.id,
      name: item.name,
      image: item.image ?? '',
      category: item.category,
      defaultQuantity: 1,
    };
    const existing = rankedItems.get(key);

    if (existing) {
      existing.score += scoreIncrement;
      if (!existing.item.image && candidate.image) {
        existing.item.image = candidate.image;
      }
      return;
    }

    rankedItems.set(key, {
      item: candidate,
      score: scoreIncrement,
    });
  });

  return Array.from(rankedItems.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
