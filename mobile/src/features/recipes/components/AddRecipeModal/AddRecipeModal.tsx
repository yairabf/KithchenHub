import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../../theme';
import { EntityFormModal } from '../../../../common/components/EntityFormModal';
import { stripToDigitsOnly, stripToNumeric } from '../../../../common/utils';
import { useDebouncedRemoteSearch } from '../../../../common/hooks';
import { GrocerySearchBar, GroceryItem } from '../../../shopping/components/GrocerySearchBar';
import { UnitPicker } from '../UnitPicker';
import { getRecipeCategoryLabel, getUnitLabel, RECIPE_CATEGORIES } from '../../constants';
import { styles } from './styles';
import { AddRecipeModalProps, NewRecipeData, Ingredient } from './types';
import { useTranslation } from 'react-i18next';

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
  categories = RECIPE_CATEGORIES,
  groceryItems = [],
  mode = 'create',
  initialRecipe,
  searchGroceries,
}: AddRecipeModalProps) {
  const { t, i18n } = useTranslation('recipes');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;
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
      return t('form.validation.titleRequired');
    }
    if (trimmed.length < 2) {
      return t('form.validation.titleMinLength');
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
      Alert.alert(t('form.permissionRequiredTitle'), t('form.permissionRequiredMessage'));
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
    <EntityFormModal
      visible={visible}
      onClose={onClose}
      title={mode === 'edit' ? t('form.modalTitleEdit') : t('form.modalTitleCreate')}
      submitText={mode === 'edit' ? t('form.submitEdit') : t('form.submitCreate')}
      onSubmit={handleSave}
      submitColor={colors.recipes}
      submitDisabled={!isValid || isSaving}
      submitLoading={isSaving}
    >
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipe Title */}
        <View style={[styles.section, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.label, isRtlLayout && styles.modalTextRtl]}>{t('form.recipeTitleLabel')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              isRtlLayout && styles.inputRtl,
              isRtlLayout && styles.modalTextRtl,
              titleError && titleTouched && styles.inputError
            ]}
            placeholder={t('form.recipeTitlePlaceholder')}
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
            <Text style={[styles.errorText, isRtlLayout && styles.modalTextRtl]}>{titleError}</Text>
          )}
        </View>

        {/* Category Selection */}
        <View style={[styles.section, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.label, isRtlLayout && styles.modalTextRtl]}>{t('form.categoryLabel')}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoryScrollContent, isRtlLayout && styles.pickerContentRtl]}
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
                    isRtlLayout && styles.modalTextRtl,
                    recipe.category === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {getRecipeCategoryLabel(cat, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prep Time */}
        <View style={[styles.section, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.label, isRtlLayout && styles.modalTextRtl]}>{t('form.prepTime')}</Text>
          </View>
          <TextInput
            style={[styles.input, isRtlLayout && styles.inputRtl, isRtlLayout && styles.modalTextRtl]}
            placeholder={t('form.prepTimePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={recipe.prepTime}
            onChangeText={(text) =>
              setRecipe({ ...recipe, prepTime: stripToDigitsOnly(text) })
            }
            keyboardType="number-pad"
          />
        </View>

        {/* Description */}
        <View style={[styles.section, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.label, isRtlLayout && styles.modalTextRtl]}>{t('form.descriptionLabel')}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, isRtlLayout && styles.inputRtl, isRtlLayout && styles.modalTextRtl]}
            placeholder={t('form.descriptionPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={recipe.description}
            onChangeText={(text) => setRecipe({ ...recipe, description: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Photo */}
        <View style={[styles.section, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.label, isRtlLayout && styles.modalTextRtl]}>{t('form.photoLabel')}</Text>
          </View>
          <View style={[styles.photoRow, isRtlLayout && styles.photoRowRtl]}>
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
                <Text style={[styles.photoButtonText, isRtlLayout && styles.modalTextRtl]}>
                  {imageUri ? t('form.changePhoto') : t('form.addPhoto')}
                </Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity style={styles.photoButtonSecondary} onPress={handleRemoveImage}>
                  <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.photoButtonSecondaryText, isRtlLayout && styles.modalTextRtl]}>{t('form.removePhoto')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={[styles.section, styles.ingredientsSection, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.sectionTitle, isRtlLayout && styles.modalTextRtl]}>{t('detail.ingredients')}</Text>
          </View>

          {/* Grocery Search Bar */}
          <GrocerySearchBar
            items={searchGroceries ? (searchQuery ? searchResults : []) : groceryItems}
            onSelectItem={handleAddIngredientFromSearch}
            onQuickAddItem={handleAddIngredientFromSearch}
            placeholder={t('form.searchIngredientsPlaceholder')}
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
              <View key={ing.id} style={[styles.ingredientRow, isRtlLayout && styles.ingredientRowRtl]}>
                <TextInput
                  style={[styles.input, styles.qtyInput, isRtlLayout && styles.inputRtl, isRtlLayout && styles.modalTextRtl]}
                  placeholder={t('form.quantityPlaceholder')}
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
                  style={[styles.input, styles.unitTrigger, isRtlLayout && styles.unitTriggerRtl]}
                  onPress={() => setUnitPickerIngredientId(ing.id)}
                  accessibilityRole="button"
                  accessibilityLabel={ing.quantityUnit
                    ? t('form.unitWithValueAccessibilityLabel', { unit: getUnitLabel(ing.quantityUnit, t) })
                    : t('form.selectUnitAccessibilityLabel')}
                >
                  <Text
                    style={[
                      ing.quantityUnit ? styles.unitTriggerText : styles.unitTriggerPlaceholder,
                      isRtlLayout && styles.modalTextRtl,
                    ]}
                    numberOfLines={1}
                  >
                    {ing.quantityUnit ? getUnitLabel(ing.quantityUnit, t) : t('form.unitPlaceholder')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.input,
                    styles.nameInput,
                    isRtlLayout && styles.inputRtl,
                    isRtlLayout && styles.modalTextRtl,
                    isNameLocked && styles.nameInputReadOnly,
                  ]}
                  placeholder={t('form.ingredientPlaceholder')}
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
                      ? t('form.ingredientReadonlyAccessibilityLabel', { name: ing.name })
                      : t('form.ingredientNameAccessibilityLabel')
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
        <View style={[styles.section, isRtlLayout && styles.modalSectionRtl]}>
          <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
            <Text style={[styles.sectionTitle, isRtlLayout && styles.modalTextRtl]}>{t('detail.steps')}</Text>
          </View>
          {(recipe.instructions || []).map((step, idx) => (
            <View key={step.id} style={[styles.stepRow, isRtlLayout && styles.stepRowRtl]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.stepInput, isRtlLayout && styles.inputRtl, isRtlLayout && styles.modalTextRtl]}
                placeholder={t('form.stepPlaceholder')}
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
          <TouchableOpacity style={[styles.addRowButton, isRtlLayout && styles.addRowButtonRtl]} onPress={handleAddStep}>
            <Ionicons name="add" size={18} color={colors.textSecondary} />
            <Text style={[styles.addRowButtonText, isRtlLayout && styles.modalTextRtl]}>{t('form.addStepButton')}</Text>
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
    </EntityFormModal>
  );
}
