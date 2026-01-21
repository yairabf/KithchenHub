import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
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
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryTile}
            onPress={() => onCategoryPress(category.name)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={{ uri: category.image }}
              style={styles.categoryBg}
              imageStyle={styles.categoryBgImage}
            >
              <View style={[styles.categoryOverlay, { backgroundColor: category.backgroundColor }]}>
                <Text style={styles.categoryCount}>{category.itemCount}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
