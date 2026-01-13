import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DashboardScreen } from './DashboardScreen';
import { ShoppingListsScreen } from './shopping/ShoppingListsScreen';
import { RecipesScreen } from './RecipesScreen';
import { ChoresScreen } from './ChoresScreen';
import { SettingsScreen } from './SettingsScreen';
import { BottomPillNav, TabKey } from '../components/navigation';
import { ShoppingQuickActionModal } from '../components/modals/ShoppingQuickActionModal';
import { ChoresQuickActionModal } from '../components/modals/ChoresQuickActionModal';
import { MainStackParamList } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

// Tab order for determining swipe direction
const TAB_ORDER: TabKey[] = ['Dashboard', 'Shopping', 'Chores', 'Recipes', 'Settings'];

const getTabIndex = (tab: TabKey): number => TAB_ORDER.indexOf(tab);

export function MainTabsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabKey>('Dashboard');
  const [shoppingModalVisible, setShoppingModalVisible] = useState(false);
  const [choresModalVisible, setChoresModalVisible] = useState(false);
  const [shoppingButtonPosition, setShoppingButtonPosition] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  
  // Store reference to ChoresScreen's handleAddChore
  const choreHandlerRef = useRef<((newChore: any) => void) | null>(null);

  // Animation value for screen position
  const translateX = useSharedValue(0);
  const previousTabRef = useRef<TabKey>('Dashboard');

  const handleTabPress = useCallback((tabKey: TabKey) => {
    if (tabKey === activeTab) return;

    const currentIndex = getTabIndex(activeTab);
    const nextIndex = getTabIndex(tabKey);
    const isMovingRight = nextIndex > currentIndex;

    // Store previous tab for rendering during animation
    previousTabRef.current = activeTab;

    // Update active tab immediately
    setActiveTab(tabKey);

    // Start animation from offset position
    translateX.value = isMovingRight ? SCREEN_WIDTH : -SCREEN_WIDTH;

    // Animate to center
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeTab, translateX]);

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

  const handleNavigateToSingleList = useCallback((listId: string, listName: string) => {
    navigation.navigate('SingleList', { listId, listName });
  }, [navigation]);

  const handleAddChore = useCallback((newChore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => {
    // This will be called by the modal and passed to ChoresScreen
    if (choreHandlerRef.current) {
      choreHandlerRef.current(newChore);
    }
  }, []);

  const setChoreHandler = useCallback((handler: ((newChore: any) => void) | null) => {
    choreHandlerRef.current = handler;
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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
        return (
          <ShoppingListsScreen
            onNavigateToSingleList={handleNavigateToSingleList}
          />
        );
      case 'Recipes':
        return <RecipesScreen />;
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
      <View style={styles.screenContainer}>
        <Animated.View style={[styles.screen, animatedStyle]}>
          {renderScreen(activeTab)}
        </Animated.View>
      </View>

      <BottomPillNav activeTab={activeTab} onTabPress={handleTabPress} />

      <ShoppingQuickActionModal
        visible={shoppingModalVisible}
        onClose={handleCloseShoppingModal}
        buttonPosition={shoppingButtonPosition}
      />
      <ChoresQuickActionModal
        visible={choresModalVisible}
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
  },
});
