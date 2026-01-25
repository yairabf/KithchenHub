import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { isValidImageUrl } from '../../../../common/utils/imageUtils';
import { styles } from './styles';
import { CategoriesGridProps } from './types';

export function CategoriesGrid({
  categories,
  onCategoryPress,
  onSeeAllPress,
}: CategoriesGridProps) {
  return (
    <View style={styles.categoriesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => {
          // Only use ImageBackground if category has a valid image URL
          const hasImage = isValidImageUrl(category.image);
          
          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryTile}
              onPress={() => onCategoryPress(category.name)}
              activeOpacity={0.8}
            >
              {hasImage ? (
                <ImageBackground
                  testID={`category-image-background-${category.id}`}
                  source={{ uri: category.image }}
                  style={styles.categoryBg}
                  imageStyle={styles.categoryBgImage}
                >
                  <View style={[styles.categoryOverlay, { backgroundColor: category.backgroundColor }]}>
                    <Text style={styles.categoryCount}>{category.itemCount}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </ImageBackground>
              ) : (
                <View 
                  testID={`category-no-image-${category.id}`}
                  style={[styles.categoryBg, { backgroundColor: category.backgroundColor }]}
                >
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryCount}>{category.itemCount}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
