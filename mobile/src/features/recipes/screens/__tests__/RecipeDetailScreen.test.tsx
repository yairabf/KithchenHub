import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { RecipeDetailScreen } from '../RecipeDetailScreen';

const mockRepository = {
  getShoppingData: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
};

const mockShoppingService = {
  getShoppingData: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
};

const mockUseCatalog = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { dir: () => 'ltr', language: 'en' },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../../../common/hooks', () => ({
  useResponsive: () => ({ isTablet: false, width: 390 }),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', householdId: 'household-1', isGuest: false },
  }),
}));

jest.mock('../../hooks/useRecipes', () => ({
  useRecipes: () => ({
    getRecipeById: jest.fn(),
    updateRecipe: jest.fn(),
  }),
}));

jest.mock('../RecipeDetailScreen.utils', () => jest.requireActual('../RecipeDetailScreen.utils'));

jest.mock('../../utils/recipeFactory', () => ({
  mapFormDataToRecipeUpdates: jest.fn(),
  mapRecipeToFormData: jest.fn(() => ({ ingredients: [], instructions: [] })),
}));

jest.mock('../../../../common/hooks/useCatalog', () => ({
  useCatalog: () => mockUseCatalog(),
}));

jest.mock('../../../shopping/services/shoppingService', () => ({
  createShoppingService: jest.fn(() => mockShoppingService),
}));

jest.mock('../../../../common/repositories/cacheAwareShoppingRepository', () => ({
  CacheAwareShoppingRepository: jest.fn().mockImplementation(() => mockRepository),
}));

jest.mock('../../components/RecipeHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    RecipeHeader: () => <View testID="recipe-header" />,
  };
});

jest.mock('../../../../common/components/ScreenHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScreenHeader: () => <View testID="screen-header" />,
  };
});

jest.mock('../../../../common/components/Toast', () => ({
  Toast: () => null,
}));

jest.mock('../../../../common/components/ShareModal', () => ({
  ShareModal: () => null,
}));

jest.mock('../../../shopping/components/IngredientConflictModal', () => ({
  IngredientConflictModal: () => null,
}));

jest.mock('../../components/AddRecipeModal', () => ({
  AddRecipeModal: () => null,
}));

jest.mock('../../components/RecipeContentWrapper', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    RecipeContentWrapper: ({ recipe, onAddIngredient, onAddAllIngredients }: any) => (
      <View>
        <Text testID="ingredient-image-0">{recipe.ingredients?.[0]?.image ?? 'no-image'}</Text>
        <Text testID="ingredient-image-1">{recipe.ingredients?.[1]?.image ?? 'no-image'}</Text>
        <TouchableOpacity
          testID="add-first-ingredient"
          onPress={() => onAddIngredient?.(recipe.ingredients[0])}
        >
          <Text>Add first ingredient</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="add-all-ingredients" onPress={() => onAddAllIngredients?.()}>
          <Text>Add all ingredients</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

const baseRecipe = {
  id: 'recipe-1',
  localId: 'recipe-1',
  title: 'Fruit Salad',
  category: 'Lunch',
  ingredients: [
    {
      name: 'Apple',
      catalogItemId: 'catalog-apple',
      quantityAmount: 2,
      quantityUnit: 'pcs',
    },
    {
      name: 'Milk',
      catalogItemId: 'catalog-milk',
      quantityAmount: 1,
      quantityUnit: 'cup',
    },
  ],
  instructions: [],
};

describe('RecipeDetailScreen shopping integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository.getShoppingData.mockResolvedValue({
      shoppingLists: [{ id: 'list-main', name: 'Main List', isMain: true }],
      shoppingItems: [],
    });
    mockRepository.createItem.mockImplementation(async (item: any) => item);
    mockRepository.updateItem.mockImplementation(async (_id: string, updates: any) => updates);

    mockShoppingService.getShoppingData.mockResolvedValue({
      shoppingLists: [{ id: 'list-main', name: 'Main List', isMain: true }],
      shoppingItems: [],
    });
    mockShoppingService.createItem.mockImplementation(async (item: any) => item);
    mockShoppingService.updateItem.mockImplementation(async (_id: string, updates: any) => updates);

    mockUseCatalog.mockReturnValue({
      groceryItems: [
        { id: 'catalog-apple', name: 'Apple', category: 'fruits', image: 'apple.png' },
        { id: 'catalog-milk', name: 'Milk', category: 'dairy', image: 'milk.png' },
      ],
      searchGroceries: jest.fn(),
    });
  });

  it('enriches signed-in recipe ingredients with catalog images for display', () => {
    const { getAllByTestId } = render(
      <RecipeDetailScreen recipe={baseRecipe as any} onBack={jest.fn()} />,
    );

    expect(getAllByTestId('ingredient-image-0')[0].props.children).toBe('apple.png');
    expect(getAllByTestId('ingredient-image-1')[0].props.children).toBe('milk.png');
  });

  it('adds a recipe ingredient through the cache-aware repository with catalog/category metadata', async () => {
    const { getAllByTestId } = render(
      <RecipeDetailScreen recipe={baseRecipe as any} onBack={jest.fn()} />,
    );

    fireEvent.press(getAllByTestId('add-first-ingredient')[0]);

    await waitFor(() => {
      expect(mockRepository.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          listId: 'list-main',
          name: 'Apple',
          catalogItemId: 'catalog-apple',
          category: 'fruits',
          image: 'apple.png',
        }),
      );
    });

    expect(mockShoppingService.createItem).not.toHaveBeenCalled();
  });

  it('add-all preserves catalog/category metadata for each ingredient', async () => {
    const { getAllByTestId } = render(
      <RecipeDetailScreen recipe={baseRecipe as any} onBack={jest.fn()} />,
    );

    fireEvent.press(getAllByTestId('add-all-ingredients')[0]);

    await waitFor(() => {
      expect(mockRepository.createItem).toHaveBeenCalledTimes(2);
    });

    expect(mockRepository.createItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'Apple',
        catalogItemId: 'catalog-apple',
        category: 'fruits',
        image: 'apple.png',
      }),
    );

    expect(mockRepository.createItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'Milk',
        catalogItemId: 'catalog-milk',
        category: 'dairy',
        image: 'milk.png',
      }),
    );
  });

  it('falls back to the canonical catalog item for recipe ingredient variants like Large Eggs', async () => {
    mockUseCatalog.mockReturnValue({
      groceryItems: [
        { id: 'catalog-eggs', name: 'Eggs', category: 'dairy', image: 'eggs.png' },
      ],
      searchGroceries: jest.fn(),
    });

    const recipeWithVariantIngredient = {
      ...baseRecipe,
      ingredients: [
        {
          name: 'Large Eggs',
          quantityAmount: 2,
          quantityUnit: 'pcs',
          image: 'eggs.png',
        },
      ],
    };

    const { getAllByTestId } = render(
      <RecipeDetailScreen recipe={recipeWithVariantIngredient as any} onBack={jest.fn()} />,
    );

    fireEvent.press(getAllByTestId('add-all-ingredients')[0]);

    await waitFor(() => {
      expect(mockRepository.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Large Eggs',
          catalogItemId: 'catalog-eggs',
          category: 'dairy',
          image: 'eggs.png',
        }),
      );
    });
  });
});
