import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RecipeIngredients } from '../RecipeIngredients';
import type { Recipe, Ingredient } from '../../../../../mocks/recipes';

const appleIngredient: Ingredient = {
  id: 'ingredient-apple',
  name: 'Apple',
  quantityAmount: 2,
  quantityUnit: 'pcs',
  image: 'https://example.com/apple.png',
};

const customIngredient: Ingredient = {
  id: 'ingredient-sauce',
  name: 'Homemade Sauce Mix',
  quantityAmount: 1,
  quantityUnit: 'tbsp',
};

const recipe: Recipe = {
  id: 'recipe-1',
  localId: 'recipe-local-1',
  title: 'Apple Pasta',
  ingredients: [appleIngredient, customIngredient],
  instructions: [],
};

describe('RecipeIngredients', () => {
  it('renders catalog ingredient images in a stable thumbnail slot', () => {
    const { getByTestId } = render(
      <RecipeIngredients
        recipe={recipe}
        onAddIngredient={jest.fn()}
        onAddAllIngredients={jest.fn()}
      />,
    );

    const image = getByTestId('recipe-ingredient-image-ingredient-apple');

    expect(image.props.source).toEqual({ uri: appleIngredient.image, cache: 'force-cache' });
  });

  it('renders a polished fallback thumbnail for ingredients without images', () => {
    const { getByTestId } = render(
      <RecipeIngredients
        recipe={recipe}
        onAddIngredient={jest.fn()}
        onAddAllIngredients={jest.fn()}
      />,
    );

    expect(getByTestId('recipe-ingredient-image-ingredient-sauce')).toBeTruthy();
    expect(getByTestId('recipe-ingredient-fallback-ingredient-sauce')).toBeTruthy();
  });

  it('uses the ingredient category image when the ingredient image is missing', () => {
    const recipeWithCategoryFallback = {
      ...recipe,
      ingredients: [
        {
          ...customIngredient,
          category: 'spices',
        },
      ],
    };

    const { getByTestId } = render(
      <RecipeIngredients
        recipe={recipeWithCategoryFallback}
        onAddIngredient={jest.fn()}
        onAddAllIngredients={jest.fn()}
      />,
    );

    expect(getByTestId('recipe-ingredient-category-fallback-ingredient-sauce')).toBeTruthy();
  });

  it('uses the ingredient category image when the ingredient image URL is invalid', () => {
    const ingredientWithInvalidImage: Ingredient = {
      id: 'ingredient-eggs',
      name: 'Eggs',
      quantityAmount: 2,
      quantityUnit: 'pcs',
      image: 'eggs.png',
      category: 'dairy',
    };

    const { getByTestId } = render(
      <RecipeIngredients
        recipe={{ ...recipe, ingredients: [ingredientWithInvalidImage] }}
        onAddIngredient={jest.fn()}
        onAddAllIngredients={jest.fn()}
      />,
    );

    expect(getByTestId('recipe-ingredient-category-fallback-ingredient-eggs')).toBeTruthy();
  });

  it('does not render ingredient category metadata in recipe ingredient rows', () => {
    const recipeWithCatalogCategory = {
      ...recipe,
      ingredients: [
        {
          ...appleIngredient,
          category: 'fruits',
        },
      ],
    } as Recipe;

    const { queryByText } = render(
      <RecipeIngredients
        recipe={recipeWithCatalogCategory}
        onAddIngredient={jest.fn()}
        onAddAllIngredients={jest.fn()}
      />,
    );

    expect(queryByText('fruits')).toBeNull();
  });

  it('calls the ingredient add handler with the selected ingredient', () => {
    const onAddIngredient = jest.fn();
    const { getAllByLabelText } = render(
      <RecipeIngredients
        recipe={recipe}
        onAddIngredient={onAddIngredient}
        onAddAllIngredients={jest.fn()}
      />,
    );

    fireEvent.press(getAllByLabelText('detail.addIngredientToShoppingListAccessibilityLabel')[0]);

    expect(onAddIngredient).toHaveBeenCalledWith(appleIngredient);
  });

  it('calls the add-all handler when the add all button is pressed', () => {
    const onAddAllIngredients = jest.fn();
    const { getByLabelText } = render(
      <RecipeIngredients
        recipe={recipe}
        onAddIngredient={jest.fn()}
        onAddAllIngredients={onAddAllIngredients}
      />,
    );

    fireEvent.press(getByLabelText('detail.addAllIngredientsToShoppingListAccessibilityLabel'));

    expect(onAddAllIngredients).toHaveBeenCalledTimes(1);
  });
});
