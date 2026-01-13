import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.lg * 3) / 2;

// Screen-specific colors matching ShoppingListsScreen theme
const screenColors = {
  background: '#F5F5F0',
  surface: '#FFFFFF',
  tabActive: '#4A5D4A',
  textPrimary: '#2D3139',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  addButton: '#F5DEB3',
  quantityBg: '#F3F4F6',
  border: '#E5E7EB',
  accent: '#10B981',
};

interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}

const mockRecipes: Recipe[] = [
  { id: '1', name: 'Pancakes', cookTime: '20 min', category: 'Breakfast' },
  { id: '2', name: 'Pasta Carbonara', cookTime: '30 min', category: 'Dinner' },
  { id: '3', name: 'Caesar Salad', cookTime: '15 min', category: 'Lunch' },
  { id: '4', name: 'Tomato Soup', cookTime: '45 min', category: 'Lunch' },
  { id: '5', name: 'Grilled Chicken', cookTime: '35 min', category: 'Dinner' },
  { id: '6', name: 'French Toast', cookTime: '15 min', category: 'Breakfast' },
];

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner'];

export function RecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={screenColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={screenColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={screenColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              selectedCategory === category && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === category && styles.filterChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.grid}>
          {filteredRecipes.map((recipe) => (
            <TouchableOpacity key={recipe.id} style={styles.recipeCard} activeOpacity={0.8}>
              <View style={styles.recipeImageContainer}>
                <View style={styles.recipeImagePlaceholder}>
                  <Ionicons name="restaurant-outline" size={40} color={screenColors.textSecondary} />
                </View>
              </View>
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
                <View style={styles.recipeMetaRow}>
                  <Ionicons name="time-outline" size={14} color={screenColors.textSecondary} />
                  <Text style={styles.recipeMeta}>{recipe.cookTime}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: screenColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: screenColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: screenColors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: screenColors.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: screenColors.addButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.surface,
    margin: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: screenColors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: screenColors.textPrimary,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: screenColors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: screenColors.border,
  },
  filterChipActive: {
    backgroundColor: screenColors.tabActive,
    borderColor: screenColors.tabActive,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: screenColors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120, // Space for bottom pill nav
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: cardWidth,
    backgroundColor: screenColors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: screenColors.quantityBg,
  },
  recipeImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: spacing.sm,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '600',
    color: screenColors.textPrimary,
    marginBottom: spacing.xs,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    fontSize: 11,
    color: screenColors.textMuted,
    marginLeft: spacing.xs,
  },
});
