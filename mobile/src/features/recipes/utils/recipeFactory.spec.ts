import { getRecipeImageUrlFromFormData } from './recipeFactory';
import type { NewRecipeData } from '../components/AddRecipeModal';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'uuid-1'),
}));

const baseFormData: NewRecipeData = {
  title: 'Pasta',
  category: 'Dinner',
  prepTime: '20',
  description: '',
  ingredients: [{ id: 'ingredient-1', name: 'Pasta', quantityAmount: '1', quantityUnit: 'cup' }],
  instructions: [{ id: 'step-1', instruction: 'Cook pasta' }],
};

describe('getRecipeImageUrlFromFormData', () => {
  it('preserves a selected web image URL for save/update payloads', () => {
    expect(
      getRecipeImageUrlFromFormData({
        ...baseFormData,
        imageUrl: 'https://images.pexels.com/photos/pasta.jpg',
      }),
    ).toBe('https://images.pexels.com/photos/pasta.jpg');
  });

  it('prefers a local image URI so existing upload flow still works', () => {
    expect(
      getRecipeImageUrlFromFormData({
        ...baseFormData,
        imageLocalUri: 'file:///local-recipe.jpg',
        imageUrl: 'https://images.pexels.com/photos/pasta.jpg',
      }),
    ).toBe('file:///local-recipe.jpg');
  });
});
