import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { RecipeSidebar } from '../components/RecipeSidebar';
import { InstructionStep } from '../components/InstructionStep';
import { Toast } from '../../../common/components/Toast';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { ShareModal } from '../../../common/components/ShareModal';
import { formatRecipeText } from '../../../common/utils/shareUtils';
import { useResponsive } from '../../../common/hooks';
import type { Ingredient } from '../../../mocks/recipes';
import { styles } from './RecipeDetailScreen.styles';
import type { RecipeDetailScreenProps } from './RecipeDetailScreen.types';

export function RecipeDetailScreen({
  recipe,
  onBack,
  onAddToShoppingList,
}: RecipeDetailScreenProps) {
  const { isTablet } = useResponsive();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Format recipe for sharing using centralized formatter
  const shareText = useMemo(() => formatRecipeText(recipe), [recipe]);

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
      <ScreenHeader
        title="KITCHEN HUB"
        leftIcon="back"
        onLeftPress={onBack}
        rightActions={{
          share: { onPress: () => setShowShareModal(true), label: 'Share recipe' },
        }}
        variant="centered"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentRow, !isTablet && styles.contentRowPhone]}>
          {/* Sidebar */}
          <View style={[styles.sidebar, !isTablet && styles.sidebarPhone]}>
            <RecipeSidebar
              recipe={recipe}
              onAddIngredient={handleAddIngredient}
              onAddAllIngredients={handleAddAllIngredients}
            />
          </View>

          {/* Main Content */}
          <View style={[styles.mainContent, !isTablet && styles.mainContentPhone]}>
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

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Recipe"
        shareText={shareText}
      />
    </SafeAreaView>
  );
}
