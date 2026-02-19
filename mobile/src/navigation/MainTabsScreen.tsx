import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { ShoppingListsScreen } from '../features/shopping/screens/ShoppingListsScreen';
import { RecipesScreen } from '../features/recipes/screens/RecipesScreen';
import { ChoresScreen } from '../features/chores/screens/ChoresScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { BottomPillNav, TabKey } from '../common/components/BottomPillNav';
import { ShoppingQuickActionModal } from '../features/shopping/components/ShoppingQuickActionModal';
import { ChoreDetailsModal } from '../features/chores/components/ChoreDetailsModal';
import { RecipeDetailScreen } from '../features/recipes/screens/RecipeDetailScreen';
import type { Recipe } from '../mocks/recipes';
import { OfflineBanner } from '../common/components/OfflineBanner';
import { OfflinePill } from '../common/components/OfflinePill';
import type { AddChoreHandler } from '../features/chores/screens/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Duration in ms for tab transition animation */
const SCREEN_TRANSITION_DURATION_MS = 200;

/** Easing curve for tab transitions (Material Design standard) */
const SCREEN_TRANSITION_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

// Tab order for determining swipe direction
const TAB_ORDER: TabKey[] = ['Dashboard', 'Shopping', 'Chores', 'Recipes', 'Settings'];

const getTabIndex = (tab: TabKey): number => TAB_ORDER.indexOf(tab);

export function MainTabsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('Dashboard');
  const [shoppingModalVisible, setShoppingModalVisible] = useState(false);
  const [choresModalVisible, setChoresModalVisible] = useState(false);
  const [shoppingButtonPosition, setShoppingButtonPosition] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Store reference to ChoresScreen's handleAddChore
  const choreHandlerRef = useRef<AddChoreHandler | null>(null);

  // Animation values for screen positions - keep all screens mounted for smooth transitions
  const dashboardPosition = useSharedValue(0);
  const shoppingPosition = useSharedValue(SCREEN_WIDTH);
  const choresPosition = useSharedValue(SCREEN_WIDTH);
  const recipesPosition = useSharedValue(SCREEN_WIDTH);
  const settingsPosition = useSharedValue(SCREEN_WIDTH);

  const screenPositions: Record<TabKey, Animated.SharedValue<number>> = {
    Dashboard: dashboardPosition,
    Shopping: shoppingPosition,
    Chores: choresPosition,
    Recipes: recipesPosition,
    Settings: settingsPosition,
  };

  const handleTabPress = useCallback((tabKey: TabKey) => {
    if (tabKey === activeTab) return;

    const currentIndex = getTabIndex(activeTab);
    const nextIndex = getTabIndex(tabKey);
    const isMovingRight = nextIndex > currentIndex;

    // Clear selected recipe when leaving Recipes tab
    if (activeTab === 'Recipes') {
      setSelectedRecipe(null);
    }

    // Update active tab immediately
    setActiveTab(tabKey);

    // Animate all screens
    TAB_ORDER.forEach((tab) => {
      const tabIndex = getTabIndex(tab);
      const targetPosition = tabIndex === nextIndex 
        ? 0 
        : tabIndex < nextIndex 
          ? -SCREEN_WIDTH 
          : SCREEN_WIDTH;

      screenPositions[tab].value = withTiming(targetPosition, {
        duration: SCREEN_TRANSITION_DURATION_MS,
        easing: SCREEN_TRANSITION_EASING,
      });
    });
  }, [activeTab, screenPositions]);

  const handleOpenShoppingModal = useCallback((buttonPosition?: { x: number; y: number; width: number; height: number }) => {
    setShoppingButtonPosition(buttonPosition);
    setShoppingModalVisible(true);
  }, []);

  const handleCloseShoppingModal = useCallback(() => {
    setShoppingModalVisible(false);
  }, []);

  const handleOpenChoresModal = useCallback(() => {
    setChoresModalVisible(true);
  }, []);

  const handleCloseChoresModal = useCallback(() => {
    setChoresModalVisible(false);
  }, []);

  const handleAddChore: AddChoreHandler = useCallback((newChore) => {
    // This will be called by the modal and passed to ChoresScreen
    if (choreHandlerRef.current) {
      choreHandlerRef.current(newChore);
    }
  }, []);

  const setChoreHandler = useCallback((handler: AddChoreHandler | null) => {
    choreHandlerRef.current = handler;
  }, []);

  // Create animated styles for each screen
  const dashboardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dashboardPosition.value }],
  }));
  const shoppingStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shoppingPosition.value }],
  }));
  const choresStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: choresPosition.value }],
  }));
  const recipesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: recipesPosition.value }],
  }));
  const settingsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: settingsPosition.value }],
  }));

  const screenStyles: Record<TabKey, ReturnType<typeof useAnimatedStyle>> = {
    Dashboard: dashboardStyle,
    Shopping: shoppingStyle,
    Chores: choresStyle,
    Recipes: recipesStyle,
    Settings: settingsStyle,
  };

  const renderScreen = (tab: TabKey) => {
    switch (tab) {
      case 'Dashboard':
        return (
          <DashboardScreen
            onOpenShoppingModal={handleOpenShoppingModal}
            onOpenChoresModal={handleOpenChoresModal}
            onNavigateToTab={handleTabPress}
          />
        );
      case 'Shopping':
        return <ShoppingListsScreen isActive={activeTab === 'Shopping'} />;
      case 'Recipes':
        if (selectedRecipe) {
          return (
            <RecipeDetailScreen
              recipe={selectedRecipe}
              onBack={() => setSelectedRecipe(null)}
            />
          );
        }
        return <RecipesScreen onSelectRecipe={setSelectedRecipe} />;
      case 'Chores':
        return (
          <ChoresScreen
            onOpenChoresModal={handleOpenChoresModal}
            onRegisterAddChoreHandler={setChoreHandler}
          />
        );
      case 'Settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.screenContainer}>
        {TAB_ORDER.map((tab) => (
          <Animated.View
            key={tab}
            style={[
              styles.screen,
              screenStyles[tab],
              { position: tab === activeTab ? 'relative' : 'absolute' },
            ]}
            pointerEvents={tab === activeTab ? 'auto' : 'none'}
          >
            {renderScreen(tab)}
          </Animated.View>
        ))}
      </View>

      <OfflinePill position="bottom-right" />
      <BottomPillNav activeTab={activeTab} onTabPress={handleTabPress} />

      <ShoppingQuickActionModal
        visible={shoppingModalVisible}
        onClose={handleCloseShoppingModal}
        buttonPosition={shoppingButtonPosition}
      />
      <ChoreDetailsModal
        visible={choresModalVisible}
        mode="add"
        onClose={handleCloseChoresModal}
        onAddChore={handleAddChore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
