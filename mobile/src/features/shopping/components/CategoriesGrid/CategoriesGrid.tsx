import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isValidImageUrl } from '../../../../common/utils/imageUtils';
import { colors, spacing } from '../../../../theme';
import { styles } from './styles';
import { CategoriesGridProps } from './types';
import { CategoriesGridItem } from './CategoriesGridItem';

const INITIAL_CATEGORIES_LIMIT = 9;

/**
 * Category overlay component that displays item count and name over category background.
 * Used consistently across icon, image, and placeholder rendering paths.
 */
function CategoryOverlay({
  backgroundColor,
  itemCount,
  name
}: {
  backgroundColor: string;
  itemCount: number;
  name: string;
}) {
  return (
    <View style={styles.categoryOverlay}>
      <View style={[styles.categoryOverlayBg, { backgroundColor }]} />
      <View style={styles.categoryOverlayContent}>
        <Text style={styles.categoryCount}>{itemCount}</Text>
        <Text style={styles.categoryName}>{name}</Text>
      </View>
    </View>
  );
}

/**
 * Get category icon from assets based on category ID.
 * Returns null if icon doesn't exist (will use placeholder).
 * 
 * @param categoryId - Normalized category ID (e.g., 'fruits', 'vegetables')
 * @returns Image source object from require() or null if category has no icon
 */
function getCategoryIcon(categoryId: string): ReturnType<typeof require> | null {
  try {
    let iconResult: ReturnType<typeof require> | null = null;
    switch (categoryId) {
      case 'fruits': iconResult = require('../../../../../assets/categories/fruits.png'); break;
      case 'vegetables': iconResult = require('../../../../../assets/categories/vegetables.png'); break;
      case 'dairy': iconResult = require('../../../../../assets/categories/dairy.png'); break;
      case 'meat': iconResult = require('../../../../../assets/categories/meat.png'); break;
      case 'seafood': iconResult = require('../../../../../assets/categories/seafood.png'); break;
      case 'bakery': iconResult = require('../../../../../assets/categories/bakery.png'); break;
      case 'grains': iconResult = require('../../../../../assets/categories/grains.png'); break;
      case 'snacks': iconResult = require('../../../../../assets/categories/snacks.png'); break;
      case 'nuts': iconResult = require('../../../../../assets/categories/nuts.png'); break;
      case 'other': iconResult = require('../../../../../assets/categories/other.png'); break;
      case 'beverages': iconResult = require('../../../../../assets/categories/beverages.png'); break;
      case 'baking': iconResult = require('../../../../../assets/categories/baking.png'); break;
      case 'canned': iconResult = require('../../../../../assets/categories/canned.png'); break;
      case 'spreads': iconResult = require('../../../../../assets/categories/spreads.png'); break;
      case 'freezer': iconResult = require('../../../../../assets/categories/freezer.png'); break;
      case 'dips': iconResult = require('../../../../../assets/categories/dips.png'); break;
      case 'condiments': iconResult = require('../../../../../assets/categories/condiments.png'); break;
      case 'spices': iconResult = require('../../../../../assets/categories/spices.png'); break;
      case 'household': iconResult = require('../../../../../assets/categories/household.png'); break;
      default:
        return null;
    }
    return iconResult;
  } catch (error) {
    console.warn(`Failed to load icon for category "${categoryId}":`, error);
    return null;
  }
}

export function CategoriesGrid({
  categories,
  onCategoryPress,
}: CategoriesGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Deduplicate categories by ID to prevent duplicates
  // This is defensive programming - even though buildCategoriesFromGroceries deduplicates,
  // this ensures no duplicates slip through from other data sources
  const uniqueCategories = React.useMemo(() => {
    const seen = new Set<string>();
    return categories.filter(cat => {
      if (seen.has(cat.id)) {
        return false;
      }
      seen.add(cat.id);
      return true;
    });
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
            categoryIcon={getCategoryIcon(category.id)}
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
