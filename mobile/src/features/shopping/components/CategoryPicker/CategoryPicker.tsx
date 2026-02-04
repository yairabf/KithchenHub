import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../../../../theme';
import { styles } from './styles';
import { normalizeShoppingCategory } from '../../constants/categories';

export interface CategoryPickerProps {
  /** Currently selected category ID */
  selectedCategory: string;
  /** Callback when category is selected */
  onSelectCategory: (category: string) => void;
  /** Array of available category IDs */
  categories: string[];
}

/**
 * CategoryPicker Component
 * 
 * Horizontal scrollable list of shopping categories for selection.
 * Displays category icons (from bundled assets) and translated names.
 * Highlights the selected category.
 */
export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
  categories,
}: CategoryPickerProps) {
  const { t } = useTranslation();

  /**
   * Get category icon source from bundled assets
   * Returns null if icon not found (will show placeholder)
   * 
   * Note: Icons must be generated via sandbox/generate_category_icons.py
   * If icons don't exist, placeholders will be shown instead.
   */
  const getCategoryIconSource = (categoryId: string) => {
    // Map category IDs to require statements for bundled assets
    // Icons are generated via sandbox/generate_category_icons.py
    // Using a function to safely require icons (some may not exist yet)
    const getIcon = (id: string): any => {
      try {
        switch (id) {
          case 'fruits':
            return require('../../../../../assets/categories/fruits.png');
          case 'vegetables':
            return require('../../../../../assets/categories/vegetables.png');
          case 'dairy':
            return require('../../../../../assets/categories/dairy.png');
          case 'meat':
            return require('../../../../../assets/categories/meat.png');
          case 'seafood':
            return require('../../../../../assets/categories/seafood.png');
          case 'bakery':
            return require('../../../../../assets/categories/bakery.png');
          case 'grains':
            return require('../../../../../assets/categories/grains.png');
          case 'snacks':
            return require('../../../../../assets/categories/snacks.png');
          case 'nuts':
            return require('../../../../../assets/categories/nuts.png');
          case 'other':
            return require('../../../../../assets/categories/other.png');
          case 'beverages':
            return require('../../../../../assets/categories/beverages.png');
          case 'baking':
            return require('../../../../../assets/categories/baking.png');
          case 'canned':
            return require('../../../../../assets/categories/canned.png');
          case 'spreads':
            return require('../../../../../assets/categories/spreads.png');
          case 'freezer':
            return require('../../../../../assets/categories/freezer.png');
          case 'dips':
            return require('../../../../../assets/categories/dips.png');
          case 'condiments':
            return require('../../../../../assets/categories/condiments.png');
          case 'spices':
            return require('../../../../../assets/categories/spices.png');
          case 'household':
            return require('../../../../../assets/categories/household.png');
          default:
            return null;
        }
      } catch {
        // Icon file doesn't exist yet - will show placeholder
        return null;
      }
    };
    
    return getIcon(categoryId);
  };

  /**
   * Get translated category name
   */
  const getCategoryName = (categoryId: string): string => {
    try {
      return t(`categories:${categoryId}`, { defaultValue: categoryId });
    } catch {
      return categoryId;
    }
  };

  // Deduplicate categories to prevent duplicates
  const uniqueCategories = Array.from(new Set(categories.map(cat => normalizeShoppingCategory(cat))));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {uniqueCategories.map((categoryId) => {
          const normalizedCategory = normalizeShoppingCategory(categoryId);
          const isSelected = normalizedCategory === normalizeShoppingCategory(selectedCategory);
          const iconSource = getCategoryIconSource(normalizedCategory);
          const categoryName = getCategoryName(normalizedCategory);

          return (
            <TouchableOpacity
              key={categoryId}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
              onPress={() => onSelectCategory(normalizedCategory)}
              activeOpacity={0.7}
            >
              {iconSource ? (
                <Image
                  source={iconSource}
                  style={styles.categoryIcon}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.categoryIconPlaceholder}>
                  <Text style={styles.categoryIconText}>
                    {categoryName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
                numberOfLines={1}
              >
                {categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
