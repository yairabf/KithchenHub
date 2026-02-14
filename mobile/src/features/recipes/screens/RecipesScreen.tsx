import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../../theme';
import { colors } from '../../../theme/colors';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { RecipeCard } from '../components/RecipeCard';
import { AddRecipeModal, NewRecipeData } from '../components/AddRecipeModal';
import type { GroceryItem } from '../../shopping/components/GrocerySearchBar';
import { recipeCategories, type Recipe } from '../../../mocks/recipes';
import { useResponsive } from '../../../common/hooks';
import { resizeAndValidateImage } from '../../../common/utils';
import { config } from '../../../config';
import { styles } from './styles';
import type { RecipesScreenProps } from './types';
import { createRecipe, mapFormDataToRecipeUpdates, mapRecipeToFormData } from '../utils/recipeFactory';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../../../contexts/AuthContext';
import { useCatalog } from '../../../common/hooks/useCatalog';

// Column gap constant - same for all screen sizes
const COLUMN_GAP = spacing.md;


// Helpers removed - logic moved to RecipeService



export function RecipesScreen({ onSelectRecipe }: RecipesScreenProps) {
  const { width, isTablet } = useResponsive();
  const { user } = useAuth();
  const { recipes, isLoading, addRecipe, updateRecipe, refresh, getRecipeById } = useRecipes();
  const { groceryItems, searchGroceries } = useCatalog(); // Use catalog hook for grocery items and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showEditRecipeModal, setShowEditRecipeModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

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

  // Deduplicate recipes by ID to prevent duplicate key warnings
  const uniqueRecipes = useMemo(() => {
    const seen = new Set<string>();
    const filtered = recipes.filter(recipe => {
      const id = recipe?.id;
      if (!id) {
        return false;
      }
      // TODO: Investigate useRecipes hook or API response to ensure unique IDs and remove this client-side filtering (See Review Issue #2)
      if (seen.has(id)) {
        console.warn('[RecipesScreen] Duplicate recipe ID found, filtering out:', id, JSON.stringify({ title: recipe?.title }));
        return false;
      }
      seen.add(id);
      return true;
    });

    if (filtered.length !== recipes.length) {
      console.warn(`[RecipesScreen] Filtered ${recipes.length - filtered.length} recipes (missing IDs or duplicates). Original: ${recipes.length}, Filtered: ${filtered.length}`);
    }

    return filtered;
  }, [recipes]);

  const filteredRecipes = uniqueRecipes.filter(recipe => {
    // Safely handle recipes that might be missing fields (e.g., from API list endpoint)
    const recipeName = recipe?.title || '';
    const recipeCategory = recipe?.category || 'Dinner';

    const matchesCategory = selectedCategory === 'All' || recipeCategory === selectedCategory;
    const matchesSearch = recipeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddRecipe = () => {
    setShowAddRecipeModal(true);
  };

  const handleEditRecipe = async (recipe: Recipe) => {
    setIsLoadingEdit(true);
    try {
      const full = await getRecipeById(recipe.id);
      const hasDetails = !!full?.ingredients?.length && !!full?.instructions?.length;
      if (!hasDetails) {
        Alert.alert('Unable to edit recipe', 'Recipe details are still loading. Please try again.');
        return;
      }
      setEditingRecipe(full);
      setShowEditRecipeModal(true);
    } catch (error) {
      console.error('Failed to load recipe details for edit:', error);
      Alert.alert('Unable to edit recipe', 'Failed to load recipe details.');
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to refresh recipes:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveRecipe = async (data: NewRecipeData) => {
    try {
      setIsSavingRecipe(true);
      // Create recipe with image encoded in data (RecipeService handles upload if local URI)
      const baseRecipe = createRecipe({
        ...data,
        imageUrl: data.imageLocalUri
      });

      await addRecipe(baseRecipe);

      setShowAddRecipeModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Unable to save recipe', message);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleUpdateRecipe = async (data: NewRecipeData) => {
    if (!editingRecipe) return;
    try {
      setIsSavingEdit(true);
      const updates = mapFormDataToRecipeUpdates(data);

      if (data.removeImage) {
        await updateRecipe(editingRecipe.id, { ...updates, imageUrl: null as any });
      } else if (data.imageLocalUri) {
        // Pass local URI, RecipeService will handle upload
        await updateRecipe(editingRecipe.id, { ...updates, imageUrl: data.imageLocalUri });
      } else {
        await updateRecipe(editingRecipe.id, updates);
      }

      setShowEditRecipeModal(false);
      setEditingRecipe(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Unable to update recipe', message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="House Recipes"
        subtitle="KITCHEN COLLECTIONS"
        rightActions={{
          add: { onPress: handleAddRecipe, label: 'Add new recipe' },
        }}
      >
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
            <Text style={styles.statText}>{recipes.length} Recipes</Text>
          </View>
        </View>
      </ScreenHeader>

      {isLoading && recipes.length === 0 ? (
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
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
            {recipeCategories.map((category) => {
              const icons: { [key: string]: any } = {
                All: 'apps-outline',
                Breakfast: 'cafe-outline',
                Lunch: 'fast-food-outline',
                Dinner: 'pizza-outline',
                Snacks: 'ice-cream-outline',
                Dessert: 'car-outline' // Fallback or mapping
              };
              const iconName = icons[category] || 'restaurant-outline';
              const isActive = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={styles.filterChip}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View style={[styles.filterCircle, isActive && styles.filterCircleActive]}>
                    <Ionicons
                      name={iconName}
                      size={24}
                      color={isActive ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          >
            <View style={styles.grid}>
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  backgroundColor={colors.surface}
                  onPress={() => onSelectRecipe?.(recipe)}
                  onEdit={() => handleEditRecipe(recipe)}
                  width={cardWidth}
                />
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* Add Recipe Modal */}
      <AddRecipeModal
        visible={showAddRecipeModal}
        onClose={() => setShowAddRecipeModal(false)}
        onSave={handleSaveRecipe}
        isSaving={isSavingRecipe}
        categories={recipeCategories.filter((c) => c !== 'All')}
        groceryItems={groceryItems}
        searchGroceries={searchGroceries}
      />

      {/* Edit Recipe Modal */}
      <AddRecipeModal
        visible={showEditRecipeModal}
        onClose={() => {
          setShowEditRecipeModal(false);
          setEditingRecipe(null);
        }}
        onSave={handleUpdateRecipe}
        isSaving={isSavingEdit}
        categories={recipeCategories.filter((c) => c !== 'All')}
        groceryItems={groceryItems}
        mode="edit"
        initialRecipe={editingRecipe ? mapRecipeToFormData(editingRecipe) : undefined}
        searchGroceries={searchGroceries}
      />
    </SafeAreaView>
  );
}
