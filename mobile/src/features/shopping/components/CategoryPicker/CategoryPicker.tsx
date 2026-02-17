import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { normalizeCategoryKey } from '../../constants/categories';
import { getCategoryImageSource } from '../../utils/categoryImage';

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
  const uniqueCategories = Array.from(new Set(categories.map((cat) => normalizeCategoryKey(cat))));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {uniqueCategories.map((categoryId) => {
          const normalizedCategory = normalizeCategoryKey(categoryId);
          const isSelected = normalizedCategory === normalizeCategoryKey(selectedCategory);
          const iconSource = getCategoryImageSource(normalizedCategory);
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
