import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import {
  SHOPPING_CATEGORIES,
  normalizeCategoryKey,
} from '../../constants/categories';
import { getCategoryImageSource } from '../../utils/categoryImage';
import { styles } from './styles';
import { CategoriesGridProps } from './types';
import { CategoriesGridItem } from './CategoriesGridItem';

const INITIAL_CATEGORIES_LIMIT = 9;

const formatCategoryName = (categoryId: string): string =>
  categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

export function CategoriesGrid({
  categories,
  onCategoryPress,
}: CategoriesGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Deduplicate categories by ID to prevent duplicates
  // This is defensive programming - even though buildCategoriesFromGroceries deduplicates,
  // this ensures no duplicates slip through from other data sources
  const uniqueCategories = React.useMemo(() => {
    const existingById = new Map(
      categories.map((category) => [normalizeCategoryKey(category.id), category]),
    );

    const baseCategories = SHOPPING_CATEGORIES.map((id) => {
      const existing = existingById.get(id);
      if (existing) {
        return { ...existing, id };
      }

      return {
        id,
        localId: `default-${id}`,
        name: formatCategoryName(id),
        itemCount: 0,
        image: '',
        backgroundColor: colors.surface,
      };
    });

    const seen = new Set(baseCategories.map((category) => category.id));
    const extras = categories
      .map((category) => ({ ...category, id: normalizeCategoryKey(category.id) }))
      .filter((category) => {
        if (seen.has(category.id)) {
          return false;
        }
        seen.add(category.id);
        return true;
      });

    return [...baseCategories, ...extras];
  }, [categories]);

  const hasMoreCategories = uniqueCategories.length > INITIAL_CATEGORIES_LIMIT;
  const displayedCategories = isExpanded
    ? uniqueCategories
    : uniqueCategories.slice(0, INITIAL_CATEGORIES_LIMIT);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.categoriesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      <View style={styles.categoriesGrid}>
        {displayedCategories.map((category) => (
          <CategoriesGridItem
            key={category.id}
            category={category}
            onPress={() => onCategoryPress(category.name)}
            categoryIcon={getCategoryImageSource(category.id)}
          />
        ))}
      </View>
      {hasMoreCategories && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={handleToggleExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>
            {isExpanded ? 'Show less' : 'Show more'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
