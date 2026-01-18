import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, pastelColors } from '../../../theme';
import { colors } from '../../../theme/colors';
import { FloatingActionButton } from '../../../common/components/FloatingActionButton';
import { RecipeCard } from '../components/RecipeCard';
import { AddRecipeModal, NewRecipeData } from '../components/AddRecipeModal';
import { mockGroceriesDB } from '../../../data/groceryDatabase';
import { mockRecipes, recipeCategories, type Recipe } from '../../../mocks/recipes';
import { useResponsive } from '../../../common/hooks';
import { styles } from './styles';
import type { RecipesScreenProps } from './types';

export function RecipesScreen({ onSelectRecipe }: RecipesScreenProps) {
  const { width, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

  // Calculate card width dynamically based on screen size
  // Account for container padding (24px each side) and gap between cards
  const cardWidth = useMemo(() => {
    const containerPadding = 24 * 2; // contentContainer padding
    const cardGap = spacing.md; // gap between 2 cards
    const availableWidth = width - containerPadding - cardGap;

    if (isTablet) {
      // 2 columns on tablet, slightly smaller cards
      return (availableWidth / 2) * 0.9;
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <FloatingActionButton
          onPress={handleAddRecipe}
        />
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
