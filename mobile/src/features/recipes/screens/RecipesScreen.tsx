import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, pastelColors } from '../../../theme';
import { colors } from '../../../theme/colors';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { RecipeCard } from '../components/RecipeCard';
import { AddRecipeModal, NewRecipeData } from '../components/AddRecipeModal';
import { mockGroceriesDB } from '../../../data/groceryDatabase';
import { mockRecipes, recipeCategories, type Recipe } from '../../../mocks/recipes';
import { useResponsive } from '../../../common/hooks';
import { styles } from './styles';
import type { RecipesScreenProps } from './types';

// Column gap constant - same for all screen sizes
const COLUMN_GAP = spacing.md;

/**
 * Calculates the margin style for a recipe card based on its position in the grid.
 * Cards in even positions (0, 2, 4...) get right margin to create column gap.
 * 
 * @param index - Zero-based index of the card in the filtered recipes array
 * @returns ViewStyle object with marginRight property
 */
const calculateCardMargin = (index: number): ViewStyle => {
  return {
    marginRight: index % 2 === 0 ? COLUMN_GAP : 0,
  };
};

export function RecipesScreen({ onSelectRecipe }: RecipesScreenProps) {
  const { width, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

  // Calculate card width dynamically based on screen size
  // Account for container padding and gap between columns
  const cardWidth = useMemo(() => {
    const containerPadding = spacing.lg * 2; // contentContainer padding (24px each side)
    const availableWidth = width - containerPadding - COLUMN_GAP;

    if (isTablet) {
      // 2 columns on tablet/web - wider cards with moderate gap between columns
      return (availableWidth / 2) - (COLUMN_GAP / 2);
    } else {
      // 2 columns on phone, use full available width
      return availableWidth / 2;
    }
  }, [width, isTablet]);

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
      description: data.description,
      ingredients: data.ingredients,
      instructions: data.instructions,
    };
    setRecipes([newRecipe, ...recipes]);
    setShowAddRecipeModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Recipes"
        rightActions={{
          add: { onPress: handleAddRecipe, label: 'Add new recipe' },
        }}
      />

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
        {recipeCategories.map((category) => (
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
              onPress={() => onSelectRecipe?.(recipe)}
              width={cardWidth}
              style={calculateCardMargin(index)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Add Recipe Modal */}
      <AddRecipeModal
        visible={showAddRecipeModal}
        onClose={() => setShowAddRecipeModal(false)}
        onSave={handleSaveRecipe}
        categories={recipeCategories.filter((c) => c !== 'All')}
        groceryItems={mockGroceriesDB}
      />
    </SafeAreaView>
  );
}
