import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RecipesScreen } from '../RecipesScreen';

const mockDeleteRecipe = jest.fn();
const mockSearchGroceries = jest.fn();
let mockI18nDirection: 'ltr' | 'rtl' = 'ltr';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      dir: () => mockI18nDirection,
    },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../common/hooks', () => ({
  useResponsive: () => ({ width: 430, isTablet: false }),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../../../common/hooks/useCatalog', () => ({
  useCatalog: () => ({
    groceryItems: [],
    searchGroceries: mockSearchGroceries,
  }),
}));

jest.mock('../../hooks/useRecipes', () => ({
  useRecipes: () => ({
    recipes: [
      {
        id: 'recipe-1',
        title: 'Shakshuka',
        category: 'Breakfast',
        ingredients: [],
        steps: [],
      },
    ],
    isLoading: false,
    addRecipe: jest.fn(),
    updateRecipe: jest.fn(),
    deleteRecipe: mockDeleteRecipe,
    refresh: jest.fn(),
    getRecipeById: jest.fn(),
  }),
}));

jest.mock('../../../../common/components/ScreenHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScreenHeader: () => <View testID="screen-header" />,
  };
});

jest.mock('../../../../common/components/EmptyState', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    EmptyState: () => <View testID="empty-state" />,
  };
});

jest.mock('../../../../common/components/CardSkeleton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CardSkeleton: () => <View testID="card-skeleton" />,
  };
});

jest.mock('../../components/RecipeCard', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    RecipeCard: ({ recipe }: { recipe: { title: string } }) => <Text>{recipe.title}</Text>,
  };
});

jest.mock('../../components/AddRecipeModal', () => ({
  AddRecipeModal: () => null,
}));

jest.mock('../../../../common/components/Toast', () => ({
  Toast: () => null,
}));

jest.mock('../../../../common/components/ConfirmationModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ConfirmationModal: ({ visible }: { visible: boolean }) => (
      <Text>{visible ? 'confirmation-visible' : 'confirmation-hidden'}</Text>
    ),
  };
});

jest.mock('../../../../common/components/SwipeableWrapper', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    SwipeableWrapper: ({
      children,
      onSwipeDelete,
      deleteOnSwipeOpen,
      allowedSwipeDirection,
    }: {
      children: React.ReactNode;
      onSwipeDelete: () => void;
      deleteOnSwipeOpen?: boolean;
      allowedSwipeDirection?: 'left' | 'right' | 'both';
    }) => (
      <View>
        <Text>{`swipe-props:${String(deleteOnSwipeOpen)}:${allowedSwipeDirection ?? 'both'}`}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={onSwipeDelete} testID="trigger-swipe-delete">
          <Text>trigger-swipe-delete</Text>
        </TouchableOpacity>
        {children}
      </View>
    ),
  };
});

describe('RecipesScreen swipe deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18nDirection = 'ltr';
  });

  it('configures recipe cards for direct swipe deletion in either direction', () => {
    const { getByText } = render(<RecipesScreen />);

    expect(getByText('swipe-props:true:both')).toBeTruthy();
  });

  it('keeps recipe swipe-delete bidirectional in RTL', () => {
    mockI18nDirection = 'rtl';

    const { getByText } = render(<RecipesScreen />);

    expect(getByText('swipe-props:true:both')).toBeTruthy();
  });

  it('opens the confirmation modal when a recipe swipe delete is triggered', () => {
    const { getByTestId, getByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('trigger-swipe-delete'));

    expect(getByText('confirmation-visible')).toBeTruthy();
    expect(mockDeleteRecipe).not.toHaveBeenCalled();
  });
});
