import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Animated,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecipeHeader } from '../components/RecipeHeader';
import { RecipeContentWrapper } from '../components/RecipeContentWrapper';
import { Toast } from '../../../common/components/Toast';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { ShareModal } from '../../../common/components/ShareModal';
import { formatRecipeText } from '../../../common/utils/shareUtils';
import { useResponsive } from '../../../common/hooks';
import type { Ingredient, Recipe } from '../../../mocks/recipes';
import { colors } from '../../../theme';
import { styles } from './RecipeDetailScreen.styles';
import type { RecipeDetailScreenProps } from './RecipeDetailScreen.types';
import { STICKY_HEADER_ANIMATION, SCROLL_CONFIG } from './RecipeDetailScreen.constants';
import {
  calculateStickyHeaderTopPosition,
  calculateIsHeaderScrolled,
  calculateSpacerHeight,
  calculateShouldShowStickyHeader,
} from './RecipeDetailScreen.utils';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../../../contexts/AuthContext';

export function RecipeDetailScreen({
  recipe,
  onBack,
  onAddToShoppingList,
}: RecipeDetailScreenProps) {
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getRecipeById } = useRecipes();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [fullRecipe, setFullRecipe] = useState<Recipe | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const fetchingRef = useRef<string | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);
  
  // Check if recipe has full details (ingredients/instructions)
  const hasFullDetails = useMemo(() => {
    return recipe.ingredients && recipe.ingredients.length > 0;
  }, [recipe.ingredients]);
  
  // Reset state when recipe ID changes
  useEffect(() => {
    if (lastFetchedIdRef.current !== recipe.id) {
      // Recipe ID changed, reset state
      setFullRecipe(null);
      setIsLoadingDetails(false);
      fetchingRef.current = null;
    }
  }, [recipe.id]);
  
  // Fetch full recipe details if missing
  useEffect(() => {
    // If recipe already has full details or is guest mode, use recipe prop directly
    if (hasFullDetails || user?.isGuest || !recipe.id) {
      setFullRecipe(recipe);
      lastFetchedIdRef.current = recipe.id;
      fetchingRef.current = null;
      return;
    }
    
    // If we already fetched this recipe ID, don't fetch again
    if (lastFetchedIdRef.current === recipe.id) {
      return;
    }
    
    // If we're already fetching this recipe, don't start another fetch
    if (fetchingRef.current === recipe.id) {
      return;
    }
    
    // Fetch full details
    fetchingRef.current = recipe.id;
    setIsLoadingDetails(true);
    getRecipeById(recipe.id)
      .then((fetchedRecipe) => {
        if (fetchedRecipe && fetchedRecipe.id === recipe.id) {
          console.log('[RecipeDetailScreen] Fetched full recipe details:', JSON.stringify(fetchedRecipe, null, 2));
          setFullRecipe(fetchedRecipe);
          lastFetchedIdRef.current = recipe.id;
        }
      })
      .catch((error) => {
        console.error('[RecipeDetailScreen] Failed to fetch recipe details:', error);
      })
      .finally(() => {
        setIsLoadingDetails(false);
        fetchingRef.current = null;
      });
  }, [recipe.id, hasFullDetails, getRecipeById, user?.isGuest]);
  
  // Use fullRecipe if available, otherwise fall back to recipe prop
  const displayRecipe = fullRecipe || recipe;

  // Track scroll position and header height for sticky header
  const [scrollY, setScrollY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [screenHeaderHeight, setScreenHeaderHeight] = useState(0);
  const [screenHeaderY, setScreenHeaderY] = useState(0);
  const [contentHeaderHeight, setContentHeaderHeight] = useState(0);

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');

  // Animated values for smooth sticky header transition
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyHeaderTranslateY = useRef(new Animated.Value(STICKY_HEADER_ANIMATION.INITIAL_TRANSLATE_Y)).current;

  // Calculate sticky header top position accounting for safe area insets
  const stickyHeaderTop = useMemo(
    () => calculateStickyHeaderTopPosition(screenHeaderHeight, screenHeaderY),
    [screenHeaderHeight, screenHeaderY]
  );

  // Check if RecipeHeader has been scrolled past (with smoother threshold)
  const isHeaderScrolled = useMemo(
    () => calculateIsHeaderScrolled(scrollY, headerHeight),
    [scrollY, headerHeight]
  );

  /**
   * Animates sticky header fade in and slide down
   */
  const animateStickyHeaderIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(stickyHeaderOpacity, {
        toValue: 1,
        duration: STICKY_HEADER_ANIMATION.FADE_IN_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(stickyHeaderTranslateY, {
        toValue: 0,
        tension: STICKY_HEADER_ANIMATION.SPRING_TENSION,
        friction: STICKY_HEADER_ANIMATION.SPRING_FRICTION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stickyHeaderOpacity, stickyHeaderTranslateY]);

  /**
   * Animates sticky header fade out and slide up
   */
  const animateStickyHeaderOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(stickyHeaderOpacity, {
        toValue: 0,
        duration: STICKY_HEADER_ANIMATION.FADE_OUT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(stickyHeaderTranslateY, {
        toValue: STICKY_HEADER_ANIMATION.SLIDE_OUT_OFFSET,
        duration: STICKY_HEADER_ANIMATION.FADE_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stickyHeaderOpacity, stickyHeaderTranslateY]);

  const shouldShowStickyHeader = useMemo(
    () => calculateShouldShowStickyHeader(isHeaderScrolled, contentHeaderHeight, screenHeaderHeight),
    [isHeaderScrolled, contentHeaderHeight, screenHeaderHeight]
  );

  // Animate sticky header appearance/disappearance smoothly
  useEffect(() => {
    if (shouldShowStickyHeader) {
      animateStickyHeaderIn();
    } else {
      animateStickyHeaderOut();
    }
  }, [shouldShowStickyHeader, animateStickyHeaderIn, animateStickyHeaderOut]);

  // Format recipe for sharing using centralized formatter
  const shareText = useMemo(() => formatRecipeText(displayRecipe), [displayRecipe]);

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
    const ingredients = displayRecipe.ingredients || [];
    if (onAddToShoppingList && ingredients.length > 0) {
      onAddToShoppingList(ingredients);
      showToast(`All ${ingredients.length} ingredients added`);
    } else if (ingredients.length === 0) {
      showToast('No ingredients to add');
    }
  }, [onAddToShoppingList, displayRecipe.ingredients, showToast]);

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
    const { height, y } = event.nativeEvent.layout;
    setScreenHeaderHeight(height);
    setScreenHeaderY(y);
  }, []);

  // Handle content header height measurement (for spacer)
  const handleContentHeaderLayout = useCallback((height: number) => {
    if (height > 0) {
      setContentHeaderHeight(height);
    }
  }, []);

  // Calculate spacer height to prevent layout shift
  const spacerHeight = useMemo(
    () => calculateSpacerHeight(isHeaderScrolled, contentHeaderHeight),
    [isHeaderScrolled, contentHeaderHeight]
  );


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
      {screenHeaderHeight > 0 && contentHeaderHeight > 0 && (
        <Animated.View
          style={[
            styles.stickyHeader,
            {
              top: stickyHeaderTop,
              opacity: stickyHeaderOpacity,
              transform: [{ translateY: stickyHeaderTranslateY }],
            }
          ]}
          pointerEvents={isHeaderScrolled ? 'auto' : 'none'}
        >
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
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={SCROLL_CONFIG.EVENT_THROTTLE}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {/* Recipe Header */}
        <View style={styles.headerSection} onLayout={handleHeaderLayout}>
          <RecipeHeader recipe={displayRecipe} />
        </View>

        {/* Recipe Content Wrapper */}
        {/* Spacer to prevent jump - always render to prevent layout shift */}
        <View style={[styles.stickyHeaderSpacer, { height: spacerHeight }]} />

        {isLoadingDetails ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.recipes} />
            <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading recipe details...</Text>
          </View>
        ) : (
          <RecipeContentWrapper
            recipe={displayRecipe}
            completedSteps={completedSteps}
            onToggleStep={handleToggleStep}
            onAddIngredient={handleAddIngredient}
            onAddAllIngredients={handleAddAllIngredients}
            hideHeaderWhenSticky={isHeaderScrolled}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onHeaderLayout={handleContentHeaderLayout}
          />
        )}
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
