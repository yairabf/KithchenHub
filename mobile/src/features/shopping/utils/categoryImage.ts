import { normalizeShoppingCategory } from '../constants/categories';

export const isValidItemImage = (value?: string) =>
  typeof value === 'string' && value.trim().length > 0;

export const getCategoryImageSource = (categoryId: string): number | null => {
  try {
    switch (normalizeShoppingCategory(categoryId)) {
      case 'fruits':
        return require('../../../../assets/categories/fruits.png');
      case 'vegetables':
        return require('../../../../assets/categories/vegetables.png');
      case 'dairy':
        return require('../../../../assets/categories/dairy.png');
      case 'meat':
        return require('../../../../assets/categories/meat.png');
      case 'seafood':
        return require('../../../../assets/categories/seafood.png');
      case 'bakery':
        return require('../../../../assets/categories/bakery.png');
      case 'grains':
        return require('../../../../assets/categories/grains.png');
      case 'snacks':
        return require('../../../../assets/categories/snacks.png');
      case 'nuts':
        return require('../../../../assets/categories/nuts.png');
      case 'beverages':
        return require('../../../../assets/categories/beverages.png');
      case 'baking':
        return require('../../../../assets/categories/baking.png');
      case 'canned':
        return require('../../../../assets/categories/canned.png');
      case 'spreads':
        return require('../../../../assets/categories/spreads.png');
      case 'freezer':
        return require('../../../../assets/categories/freezer.png');
      case 'dips':
        return require('../../../../assets/categories/dips.png');
      case 'condiments':
        return require('../../../../assets/categories/condiments.png');
      case 'spices':
        return require('../../../../assets/categories/spices.png');
      case 'household':
        return require('../../../../assets/categories/household.png');
      case 'other':
      default:
        return require('../../../../assets/categories/other.png');
    }
  } catch {
    return null;
  }
};
