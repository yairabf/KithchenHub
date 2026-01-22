import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { RecipeHeader } from '../components/RecipeHeader';
import { RecipeContentWrapper } from '../components/RecipeContentWrapper';
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
  
  // Track scroll position and header height for sticky header
  const [scrollY, setScrollY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [screenHeaderHeight, setScreenHeaderHeight] = useState(0);
  
  // Mobile tab state
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  
  // Check if RecipeHeader has been scrolled past
  const isHeaderScrolled = headerHeight > 0 && scrollY >= headerHeight - 10;

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

  // Handle scroll position tracking
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  }, []);

  // Handle header height measurement
  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      setHeaderHeight(height);
    }
  }, []);

  // Handle screen header height measurement
  const handleScreenHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setScreenHeaderHeight(height);
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <View onLayout={handleScreenHeaderLayout}>
        <ScreenHeader
          title="KITCHEN HUB"
          leftIcon="back"
          onLeftPress={onBack}
          rightActions={{
            share: { onPress: () => setShowShareModal(true), label: 'Share recipe' },
          }}
          variant="centered"
        />
      </View>

      {/* Fixed sticky header when RecipeHeader is scrolled past */}
      {isHeaderScrolled && screenHeaderHeight > 0 && (
        <View style={[styles.stickyHeader, { top: screenHeaderHeight }]}>
          <RecipeContentWrapper
            recipe={recipe}
            completedSteps={completedSteps}
            onToggleStep={handleToggleStep}
            onAddIngredient={handleAddIngredient}
            onAddAllIngredients={handleAddAllIngredients}
            renderHeaderOnly={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {/* Recipe Header */}
        <View style={styles.headerSection} onLayout={handleHeaderLayout}>
          <RecipeHeader recipe={recipe} />
        </View>

        {/* Recipe Content Wrapper */}
        <RecipeContentWrapper
          recipe={recipe}
          completedSteps={completedSteps}
          onToggleStep={handleToggleStep}
          onAddIngredient={handleAddIngredient}
          onAddAllIngredients={handleAddAllIngredients}
          hideHeaderWhenSticky={isHeaderScrolled}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
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
