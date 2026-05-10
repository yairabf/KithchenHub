import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MainTabsScreen } from '../MainTabsScreen';

jest.mock('../../common/components/OfflineBanner', () => ({
  OfflineBanner: () => null,
}));

jest.mock('../../common/components/OfflinePill', () => ({
  OfflinePill: () => null,
}));

jest.mock('../../features/shopping/components/ShoppingQuickActionModal', () => ({
  ShoppingQuickActionModal: () => null,
}));

jest.mock('../../features/chores/components/ChoreDetailsModal', () => ({
  ChoreDetailsModal: () => null,
}));

jest.mock('../../features/dashboard/screens/DashboardScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    DashboardScreen: () => <Text>Dashboard Screen</Text>,
  };
});

jest.mock('../../features/shopping/screens/ShoppingListsScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ShoppingListsScreen: () => <Text>Shopping Screen</Text>,
  };
});

jest.mock('../../features/recipes/screens/RecipesScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    RecipesScreen: () => <Text>Recipes Screen</Text>,
  };
});

jest.mock('../../features/recipes/screens/RecipeDetailScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    RecipeDetailScreen: () => <Text>Recipe Detail Screen</Text>,
  };
});

jest.mock('../../features/chores/screens/ChoresScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ChoresScreen: () => <Text>Chores Screen</Text>,
  };
});

jest.mock('../../features/settings/screens/SettingsScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    SettingsScreen: () => <Text>Settings Screen</Text>,
  };
});

jest.mock('../../common/components/BottomPillNav', () => {
  const React = require('react');
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    BottomPillNav: ({ onTabPress }: { onTabPress: (tab: string) => void }) => (
      <View>
        <TouchableOpacity testID="tab-dashboard" onPress={() => onTabPress('Dashboard')}>
          <Text>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-shopping" onPress={() => onTabPress('Shopping')}>
          <Text>Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-chores" onPress={() => onTabPress('Chores')}>
          <Text>Chores</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

describe('MainTabsScreen', () => {
  it('mounts only the active tab initially, then mounts a tab when first visited', () => {
    const { getByTestId, getByText, queryByText } = render(<MainTabsScreen />);

    expect(getByText('Dashboard Screen')).toBeTruthy();
    expect(queryByText('Shopping Screen')).toBeNull();
    expect(queryByText('Chores Screen')).toBeNull();
    expect(queryByText('Recipes Screen')).toBeNull();
    expect(queryByText('Settings Screen')).toBeNull();

    fireEvent.press(getByTestId('tab-shopping'));

    expect(getByText('Shopping Screen')).toBeTruthy();
  });
});
