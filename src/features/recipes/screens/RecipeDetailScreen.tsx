import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { RecipeSidebar } from '../components/RecipeSidebar';
import { InstructionStep } from '../components/InstructionStep';
import { Toast } from '../../../common/components/Toast';
import type { Ingredient } from '../../../mocks/recipes';
import { styles } from './RecipeDetailScreen.styles';
import type { RecipeDetailScreenProps } from './RecipeDetailScreen.types';

export function RecipeDetailScreen({
  recipe,
  onBack,
  onAddToShoppingList,
}: RecipeDetailScreenProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const handleToggleStep = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const handleAddIngredient = useCallback(
    (ingredient: Ingredient) => {
      if (onAddToShoppingList) {
        onAddToShoppingList([ingredient]);
      }
      showToast(`${ingredient.name} added`);
    },
    [onAddToShoppingList, showToast]
  );

  const handleAddAllIngredients = useCallback(() => {
    if (onAddToShoppingList) {
      onAddToShoppingList(recipe.ingredients);
    }
    showToast(`All ${recipe.ingredients.length} ingredients added`);
  }, [onAddToShoppingList, recipe.ingredients, showToast]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KITCHEN HUB</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentRow}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            <RecipeSidebar
              recipe={recipe}
              onAddIngredient={handleAddIngredient}
              onAddAllIngredients={handleAddAllIngredients}
            />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Instructions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Preparation Steps</Text>
              </View>

              <View style={styles.instructionsList}>
                {recipe.instructions.map((step, index) => (
                  <InstructionStep
                    key={step.id}
                    step={step}
                    stepNumber={index + 1}
                    isCompleted={completedSteps.has(step.id)}
                    onToggle={() => handleToggleStep(step.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}
