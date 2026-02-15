import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { stripToDigitsOnly, stripToNumeric } from '../../../../common/utils';
import { useDebouncedRemoteSearch } from '../../../../common/hooks';
import { GrocerySearchBar, GroceryItem } from '../../../shopping/components/GrocerySearchBar';
import { UnitPicker } from '../UnitPicker';
import { getUnitLabel } from '../../constants';
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
  instructions: [{ id: generateId(), instruction: '' }],
});

export function AddRecipeModal({
  visible,
  onClose,
  onSave,
  isSaving = false,
  categories = DEFAULT_CATEGORIES,
  groceryItems = [],
  mode = 'create',
  initialRecipe,
  searchGroceries,
}: AddRecipeModalProps) {
  const [recipe, setRecipe] = useState<NewRecipeData>(createEmptyRecipe());
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults } = useDebouncedRemoteSearch<GroceryItem>({
    query: searchQuery,
    searchFn: searchGroceries,
    enabled: !!searchGroceries,
    onError: (error) => {
      console.error('Ingredient search failed:', error);
    },
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageIsLocal, setImageIsLocal] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [unitPickerIngredientId, setUnitPickerIngredientId] = useState<string | null>(null);
  /** Ingredient ids whose name field has been "committed" (blurred or added from search); names are then read-only. */
  const [committedIngredientIds, setCommittedIngredientIds] = useState<Set<string>>(() => new Set());

  // Real-time validation states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialRecipe) {
        setRecipe(initialRecipe);
        setImageUri(initialRecipe.imageUrl ?? null);
        setImageIsLocal(false);
        setRemoveImage(false);
        setCommittedIngredientIds(
          new Set((initialRecipe.ingredients ?? []).map((i) => i.id)),
        );
      } else {
        setRecipe(createEmptyRecipe());
        setImageUri(null);
        setImageIsLocal(false);
        setRemoveImage(false);
        setCommittedIngredientIds(new Set());
      }
      setSearchQuery('');
      setUnitPickerIngredientId(null);
      setTitleError(null);
      setTitleTouched(false);
    }
  }, [visible, mode, initialRecipe]);

  // Validation functions
  const validateTitle = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 'Recipe title is required';
    }
    if (trimmed.length < 2) {
      return 'Title must be at least 2 characters';
    }
    return null;
  };

  const handleTitleBlur = () => {
    setTitleTouched(true);
    const error = validateTitle(recipe.title);
    setTitleError(error);
  };

  // Validation - ensure arrays exist
  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];
  const hasIngredients = ingredients.some((ing) => ing.name.trim().length > 0);
  const hasInstructions = instructions.some((inst) => inst.instruction.trim().length > 0);
  const isValid =
    recipe.title.trim().length > 0 &&
    hasIngredients &&
    hasInstructions;

  // Handlers
  const handleSave = () => {
    if (isValid && !isSaving) {
      // Filter out empty ingredients and instructions
      const cleanedRecipe: NewRecipeData = {
        ...recipe,
        ingredients: (recipe.ingredients || []).filter((ing) => ing.name.trim()),
        instructions: (recipe.instructions || []).filter((inst) => inst.instruction.trim()),
        imageLocalUri: imageIsLocal ? imageUri ?? undefined : undefined,
        imageUrl: !imageIsLocal && !removeImage ? imageUri ?? undefined : undefined,
        removeImage: removeImage || undefined,
      };
      onSave(cleanedRecipe);
    }
  };

  const handleSelectImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access photos is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
      setImageIsLocal(true);
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageIsLocal(false);
    setRemoveImage(true);
  };

  // Ingredient handlers
  const handleUpdateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string
  ) => {
    const currentIngredients = recipe.ingredients || [];
    setRecipe({
      ...recipe,
      ingredients: currentIngredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      ),
    });
  };

  const handleRemoveIngredient = (id: string) => {
    const currentIngredients = recipe.ingredients || [];
    setRecipe({
      ...recipe,
      ingredients: currentIngredients.filter((ing) => ing.id !== id),
    });
  };

  // Step handlers
  const handleAddStep = () => {
    const currentInstructions = recipe.instructions || [];
    setRecipe({
      ...recipe,
      instructions: [...currentInstructions, { id: generateId(), instruction: '' }],
    });
  };

  const handleUpdateStep = (id: string, value: string) => {
    const currentInstructions = recipe.instructions || [];
    setRecipe({
      ...recipe,
      instructions: currentInstructions.map((inst) =>
        inst.id === id ? { ...inst, instruction: value } : inst
      ),
    });
  };

  const handleRemoveStep = (id: string) => {
    const currentInstructions = recipe.instructions || [];
    if (currentInstructions.length <= 1) return;
    setRecipe({
      ...recipe,
      instructions: currentInstructions.filter((inst) => inst.id !== id),
    });
  };

  // Grocery search handler - adds ingredient and clears search; new ingredient name is locked immediately
  const handleAddIngredientFromSearch = (item: GroceryItem) => {
    const newId = generateId();
    const currentIngredients = recipe.ingredients || [];
    setRecipe({
      ...recipe,
      ingredients: [
        ...currentIngredients,
        { id: newId, quantityAmount: '', quantityUnit: '', name: item.name },
      ],
    });
    setCommittedIngredientIds((prev) => new Set(prev).add(newId));
    setSearchQuery('');
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Recipe' : 'New Recipe'}
      confirmText={isSaving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Save Recipe'}
      cancelText="Cancel"
      onConfirm={handleSave}
      confirmColor={colors.recipes}
      confirmDisabled={!isValid || isSaving}
      confirmLoading={isSaving}
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
            style={[
              styles.input,
              titleError && titleTouched && styles.inputError
            ]}
            placeholder="e.g. Thai Green Curry"
            placeholderTextColor={colors.textMuted}
            value={recipe.title}
            onChangeText={(text) => {
              setRecipe({ ...recipe, title: text });
              // Validate while typing if field has been touched
              if (titleTouched) {
                const error = validateTitle(text);
                setTitleError(error);
              }
            }}
            onBlur={handleTitleBlur}
          />
          {titleError && titleTouched && (
            <Text style={styles.errorText}>{titleError}</Text>
          )}
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
            onChangeText={(text) =>
              setRecipe({ ...recipe, prepTime: stripToDigitsOnly(text) })
            }
            keyboardType="number-pad"
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

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoPreview}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoButton} onPress={handleSelectImage}>
                <Ionicons
                  name={imageUri ? 'image-outline' : 'add'}
                  size={16}
                  color={colors.textLight}
                />
                <Text style={styles.photoButtonText}>
                  {imageUri ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity style={styles.photoButtonSecondary} onPress={handleRemoveImage}>
                  <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.photoButtonSecondaryText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={[styles.section, styles.ingredientsSection]}>
          <Text style={styles.sectionTitle}>Ingredients</Text>

          {/* Grocery Search Bar */}
          <GrocerySearchBar
            items={searchGroceries ? (searchQuery ? searchResults : []) : groceryItems}
            onSelectItem={handleAddIngredientFromSearch}
            onQuickAddItem={handleAddIngredientFromSearch}
            placeholder="Search ingredients to add..."
            variant="background"
            showShadow={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.ingredientSearchContainer}
            allowCustomItems={true}
            searchMode={searchGroceries ? 'remote' : 'local'}
          />

          {(recipe.ingredients || []).map((ing) => {
            const isNameLocked = committedIngredientIds.has(ing.id);
            return (
              <View key={ing.id} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.qtyInput]}
                  placeholder="Qty"
                  placeholderTextColor={colors.textMuted}
                  value={ing.quantityAmount}
                  onChangeText={(text) =>
                    handleUpdateIngredient(
                      ing.id,
                      'quantityAmount',
                      stripToNumeric(text),
                    )
                  }
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[styles.input, styles.unitTrigger]}
                  onPress={() => setUnitPickerIngredientId(ing.id)}
                  accessibilityRole="button"
                  accessibilityLabel={ing.quantityUnit ? `Unit: ${getUnitLabel(ing.quantityUnit)}` : 'Select unit'}
                >
                  <Text
                    style={ing.quantityUnit ? styles.unitTriggerText : styles.unitTriggerPlaceholder}
                    numberOfLines={1}
                  >
                    {ing.quantityUnit ? getUnitLabel(ing.quantityUnit) : 'Unit'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.input,
                    styles.nameInput,
                    isNameLocked && styles.nameInputReadOnly,
                  ]}
                  placeholder="Ingredient"
                  placeholderTextColor={colors.textMuted}
                  value={ing.name}
                  onChangeText={(text) =>
                    handleUpdateIngredient(ing.id, 'name', text)
                  }
                  onBlur={() =>
                    setCommittedIngredientIds((prev) => new Set(prev).add(ing.id))
                  }
                  editable={!isNameLocked}
                  accessibilityLabel={
                    isNameLocked
                      ? `Ingredient: ${ing.name} (name cannot be changed)`
                      : 'Ingredient name'
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
            );
          })}
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          {(recipe.instructions || []).map((step, idx) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.stepInput]}
                placeholder="Describe this step..."
                placeholderTextColor={colors.textMuted}
                value={step.instruction}
                onChangeText={(text) => handleUpdateStep(step.id, text)}
                multiline
              />
              {(recipe.instructions || []).length > 1 && (
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

      {unitPickerIngredientId && (() => {
        const ing = ingredients.find((i) => i.id === unitPickerIngredientId);
        if (!ing) return null;
        return (
          <UnitPicker
            visible={true}
            onClose={() => setUnitPickerIngredientId(null)}
            selectedUnit={ing.quantityUnit}
            onSelectUnit={(code) => {
              handleUpdateIngredient(ing.id, 'quantityUnit', code);
              setUnitPickerIngredientId(null);
            }}
          />
        );
      })()}
    </CenteredModal>
  );
}
