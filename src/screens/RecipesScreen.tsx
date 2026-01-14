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
import { colors, spacing, borderRadius, typography, shadows, pastelColors } from '../theme';
import { FloatingActionButton } from '../components/common/FloatingActionButton';
import { RecipeCard } from '../components/recipes';
import { AddRecipeModal, NewRecipeData } from '../components/modals/AddRecipeModal';
import { mockGroceriesDB } from '../data/groceryDatabase';

const { width } = Dimensions.get('window');
const cardWidth = ((width - spacing.lg * 3) / 2) * 0.85;

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
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddRecipe = () => {
    setShowAddRecipeModal(true);
  };

  const handleSaveRecipe = (data: NewRecipeData) => {
    const newRecipe: Recipe = {
      id: String(Date.now()),
      name: data.title,
      cookTime: data.prepTime || 'N/A',
      category: data.category || 'Dinner',
    };
    setRecipes([newRecipe, ...recipes]);
    setShowAddRecipeModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.textMuted}
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
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              backgroundColor={pastelColors[index % pastelColors.length]}
              onPress={() => console.log('Recipe pressed:', recipe.name)}
              width={cardWidth}
            />
          ))}
        </View>
      </ScrollView>

      {/* Add New Recipe Button */}
      <FloatingActionButton
        label="Add New Recipe"
        onPress={handleAddRecipe}
      />

      {/* Add Recipe Modal */}
      <AddRecipeModal
        visible={showAddRecipeModal}
        onClose={() => setShowAddRecipeModal(false)}
        onSave={handleSaveRecipe}
        categories={categories.filter((c) => c !== 'All')}
        groceryItems={mockGroceriesDB}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
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
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.recipes,
    borderColor: colors.recipes,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
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
});
