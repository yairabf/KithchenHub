import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../../../common/hooks';
import { colors } from '../../../../theme/colors';
import { RecipeIngredients } from '../RecipeIngredients';
import { RecipeSteps } from '../RecipeSteps';
import { styles } from './styles';
import type { RecipeContentWrapperProps } from './types';
import { SCROLL_VIEW_CONFIG } from '../../screens/RecipeDetailScreen.constants';

/**
 * RecipeContentWrapper component displays recipe ingredients and steps
 * with responsive layout:
 * - Tablet: Fixed header with side-by-side titles, both components always visible and independently scrollable
 * - Mobile: Tabbed interface to switch between ingredients and steps
 *
 * @param recipe - The recipe object containing ingredients and instructions
 * @param completedSteps - Set of completed step IDs
 * @param onToggleStep - Callback function when a step is toggled
 * @param onAddIngredient - Callback function when an individual ingredient is added
 * @param onAddAllIngredients - Callback function when all ingredients are added
 *
 * @example
 * ```tsx
 * <RecipeContentWrapper
 *   recipe={recipe}
 *   completedSteps={completedSteps}
 *   onToggleStep={handleToggleStep}
 *   onAddIngredient={handleAddIngredient}
 *   onAddAllIngredients={handleAddAllIngredients}
 * />
 * ```
 */
export function RecipeContentWrapper({
  recipe,
  completedSteps,
  onToggleStep,
  onAddIngredient,
  onAddAllIngredients,
  renderHeaderOnly = false,
  hideHeaderWhenSticky = false,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange,
  onHeaderLayout,
}: RecipeContentWrapperProps) {
  const { isTablet } = useResponsive();
  const { height: windowHeight } = useWindowDimensions();
  const [internalActiveTab, setInternalActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  
  // Use controlled or internal state
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const handleTabChange = useCallback((tab: 'ingredients' | 'steps') => {
    if (controlledOnTabChange) {
      controlledOnTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  }, [controlledOnTabChange]);
  
  /**
   * Handles layout measurement for header height calculation
   * Extracts duplicate logic for both tablet and mobile headers
   */
  const handleHeaderLayoutMeasurement = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && onHeaderLayout) {
      onHeaderLayout(height);
    }
  }, [onHeaderLayout]);

  /**
   * Calculates height for tablet ScrollViews to ensure they are scrollable when nested
   * Uses minimum height and window height ratio from constants
   */
  const scrollViewHeight = useMemo(() => {
    if (!isTablet) return undefined;
    return Math.max(
      SCROLL_VIEW_CONFIG.MIN_HEIGHT,
      Math.floor(windowHeight * SCROLL_VIEW_CONFIG.HEIGHT_RATIO)
    );
  }, [isTablet, windowHeight]);

  // Render only header for sticky header
  if (renderHeaderOnly) {
    if (isTablet) {
      return (
        <View style={styles.stickyHeaderContainer}>
          <View style={styles.tabletHeader}>
            <View style={styles.tabletHeaderRow}>
              <Text style={[styles.tabletTitle, styles.tabletTitleLeft]}>Ingredients</Text>
              <Text style={[styles.tabletTitle, styles.tabletTitleRight]}>Steps</Text>
            </View>
          </View>
        </View>
      );
    } else {
      // Mobile tabs sticky header
      return (
        <View style={styles.stickyHeaderContainer}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
              onPress={() => handleTabChange('ingredients')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'ingredients' }}
              accessibilityLabel="Ingredients tab"
            >
              <Ionicons
                name={activeTab === 'ingredients' ? 'list' : 'list-outline'}
                size={20}
                color={activeTab === 'ingredients' ? colors.recipes : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'ingredients' && styles.tabTextActive,
                ]}
              >
                Ingredients
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'steps' && styles.tabActive]}
              onPress={() => handleTabChange('steps')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'steps' }}
              accessibilityLabel="Steps tab"
            >
              <Ionicons
                name={activeTab === 'steps' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color={activeTab === 'steps' ? colors.recipes : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'steps' && styles.tabTextActive,
                ]}
              >
                Steps
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      {!hideHeaderWhenSticky && (
        <>
          {isTablet ? (
            /* Tablet: Fixed header with side-by-side titles */
            <View 
              style={styles.tabletHeader}
              onLayout={handleHeaderLayoutMeasurement}
            >
              <View style={styles.tabletHeaderRow}>
                <Text style={[styles.tabletTitle, styles.tabletTitleLeft]}>Ingredients</Text>
                <Text style={[styles.tabletTitle, styles.tabletTitleRight]}>Steps</Text>
              </View>
            </View>
          ) : (
            /* Mobile: Tabs */
            <View 
              style={styles.tabsContainer}
              onLayout={handleHeaderLayoutMeasurement}
            >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
            onPress={() => handleTabChange('ingredients')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'ingredients' }}
            accessibilityLabel="Ingredients tab"
          >
            <Ionicons
              name={activeTab === 'ingredients' ? 'list' : 'list-outline'}
              size={20}
              color={activeTab === 'ingredients' ? colors.recipes : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'ingredients' && styles.tabTextActive,
              ]}
            >
              Ingredients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'steps' && styles.tabActive]}
            onPress={() => handleTabChange('steps')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'steps' }}
            accessibilityLabel="Steps tab"
          >
            <Ionicons
              name={activeTab === 'steps' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={activeTab === 'steps' ? colors.recipes : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'steps' && styles.tabTextActive,
              ]}
            >
              Steps
            </Text>
          </TouchableOpacity>
        </View>
          )}
        </>
      )}

      {/* Content */}
      {isTablet ? (
        /* Tablet: Both components always visible, independently scrollable */
        <View style={styles.tabletContent}>
          {/* Ingredients - ScrollView */}
          <View style={styles.ingredientsColumn}>
            <ScrollView
              style={[
                styles.ingredientsScroll,
                scrollViewHeight ? { height: scrollViewHeight, maxHeight: scrollViewHeight } : undefined
              ]}
              contentContainerStyle={styles.ingredientsScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEnabled={true}
            >
              <RecipeIngredients
                recipe={recipe}
                onAddIngredient={onAddIngredient}
                onAddAllIngredients={onAddAllIngredients}
              />
            </ScrollView>
          </View>

          {/* Steps - ScrollView */}
          <View style={styles.stepsColumn}>
            <ScrollView
              style={[
                styles.stepsScroll,
                scrollViewHeight ? { height: scrollViewHeight, maxHeight: scrollViewHeight } : undefined
              ]}
              contentContainerStyle={styles.stepsScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEnabled={true}
            >
              <RecipeSteps
                instructions={recipe.instructions}
                completedSteps={completedSteps}
                onToggleStep={onToggleStep}
              />
            </ScrollView>
          </View>
        </View>
      ) : (
        /* Mobile: Tab content */
        <View style={styles.mobileContent}>
          {activeTab === 'ingredients' ? (
            <View style={styles.tabContent}>
              <RecipeIngredients
                recipe={recipe}
                onAddIngredient={onAddIngredient}
                onAddAllIngredients={onAddAllIngredients}
              />
            </View>
          ) : (
            <View style={styles.tabContent}>
              <RecipeSteps
                instructions={recipe.instructions}
                completedSteps={completedSteps}
                onToggleStep={onToggleStep}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
