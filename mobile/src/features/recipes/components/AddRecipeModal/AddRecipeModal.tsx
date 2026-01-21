import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { GrocerySearchBar, GroceryItem } from '../../../shopping/components/GrocerySearchBar';
import { styles } from './styles';
import { AddRecipeModalProps, NewRecipeData, Ingredient } from './types';

const DEFAULT_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyRecipe = (): NewRecipeData => ({
  title: '',
  category: '',
  prepTime: '',
  description: '',
  ingredients: [],
  instructions: [{ id: generateId(), text: '' }],
});

export function AddRecipeModal({
  visible,
  onClose,
  onSave,
  categories = DEFAULT_CATEGORIES,
  groceryItems = [],
}: AddRecipeModalProps) {
  const [recipe, setRecipe] = useState<NewRecipeData>(createEmptyRecipe());
  const [searchQuery, setSearchQuery] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setRecipe(createEmptyRecipe());
      setSearchQuery('');
    }
  }, [visible]);

  // Validation
  const isValid =
    recipe.title.trim().length > 0 &&
    recipe.ingredients.some((ing) => ing.name.trim().length > 0);

  // Handlers
  const handleSave = () => {
    if (isValid) {
      // Filter out empty ingredients and instructions
      const cleanedRecipe: NewRecipeData = {
        ...recipe,
        ingredients: recipe.ingredients.filter((ing) => ing.name.trim()),
        instructions: recipe.instructions.filter((inst) => inst.text.trim()),
      };
      onSave(cleanedRecipe);
    }
  };

  // Ingredient handlers
  const handleUpdateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string
  ) => {
    setRecipe({
      ...recipe,
      ingredients: recipe.ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      ),
    });
  };

  const handleRemoveIngredient = (id: string) => {
    setRecipe({
      ...recipe,
      ingredients: recipe.ingredients.filter((ing) => ing.id !== id),
    });
  };

  // Step handlers
  const handleAddStep = () => {
    setRecipe({
      ...recipe,
      instructions: [...recipe.instructions, { id: generateId(), text: '' }],
    });
  };

  const handleUpdateStep = (id: string, value: string) => {
    setRecipe({
      ...recipe,
      instructions: recipe.instructions.map((inst) =>
        inst.id === id ? { ...inst, text: value } : inst
      ),
    });
  };

  const handleRemoveStep = (id: string) => {
    if (recipe.instructions.length <= 1) return;
    setRecipe({
      ...recipe,
      instructions: recipe.instructions.filter((inst) => inst.id !== id),
    });
  };

  // Grocery search handler - adds ingredient and clears search
  const handleAddIngredientFromSearch = (item: GroceryItem) => {
    setRecipe({
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { id: generateId(), quantity: '', unit: '', name: item.name },
      ],
    });
    setSearchQuery('');
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="New Recipe"
      confirmText="Save Recipe"
      cancelText="Cancel"
      onConfirm={handleSave}
      confirmColor={colors.recipes}
      confirmDisabled={!isValid}
    >
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipe Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipe Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Thai Green Curry"
            placeholderTextColor={colors.textMuted}
            value={recipe.title}
            onChangeText={(text) => setRecipe({ ...recipe, title: text })}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  recipe.category === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setRecipe({ ...recipe, category: cat })}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    recipe.category === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prep Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Prep Time</Text>
          <TextInput
            style={styles.input}
            placeholder="30 mins"
            placeholderTextColor={colors.textMuted}
            value={recipe.prepTime}
            onChangeText={(text) => setRecipe({ ...recipe, prepTime: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about your dish..."
            placeholderTextColor={colors.textMuted}
            value={recipe.description}
            onChangeText={(text) => setRecipe({ ...recipe, description: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Ingredients Section */}
        <View style={[styles.section, styles.ingredientsSection]}>
          <Text style={styles.sectionTitle}>Ingredients</Text>

          {/* Grocery Search Bar */}
          <GrocerySearchBar
            items={groceryItems}
            onSelectItem={handleAddIngredientFromSearch}
            onQuickAddItem={handleAddIngredientFromSearch}
            placeholder="Search ingredients to add..."
            variant="background"
            showShadow={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.ingredientSearchContainer}
            allowCustomItems={true}
          />

          {recipe.ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.qtyInput]}
                placeholder="Qty"
                placeholderTextColor={colors.textMuted}
                value={ing.quantity}
                onChangeText={(text) =>
                  handleUpdateIngredient(ing.id, 'quantity', text)
                }
              />
              <TextInput
                style={[styles.input, styles.unitInput]}
                placeholder="Unit"
                placeholderTextColor={colors.textMuted}
                value={ing.unit}
                onChangeText={(text) =>
                  handleUpdateIngredient(ing.id, 'unit', text)
                }
              />
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Ingredient"
                placeholderTextColor={colors.textMuted}
                value={ing.name}
                onChangeText={(text) =>
                  handleUpdateIngredient(ing.id, 'name', text)
                }
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveIngredient(ing.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          {recipe.instructions.map((step, idx) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.stepInput]}
                placeholder="Describe this step..."
                placeholderTextColor={colors.textMuted}
                value={step.text}
                onChangeText={(text) => handleUpdateStep(step.id, text)}
                multiline
              />
              {recipe.instructions.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveStep(step.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addRowButton} onPress={handleAddStep}>
            <Ionicons name="add" size={18} color={colors.textSecondary} />
            <Text style={styles.addRowButtonText}>Add Step</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CenteredModal>
  );
}
