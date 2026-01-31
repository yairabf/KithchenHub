import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { Recipe } from '../../../mocks/recipes';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../config', () => ({
  config: { mockData: { enabled: true } },
}));

jest.mock('../services/recipeService', () => ({
  createRecipeService: jest.fn(),
}));

jest.mock('../../../common/hooks/useCachedEntities', () => ({
  useCachedEntities: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock('../../../common/repositories/cacheAwareRecipeRepository', () => ({
  CacheAwareRecipeRepository: jest.fn(),
}));

import { useRecipes } from './useRecipes';

const mockUseAuth = jest.requireMock('../../../contexts/AuthContext').useAuth;
const createRecipeService = jest.requireMock('../services/recipeService').createRecipeService;

function createMockRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'mock-1',
    localId: 'local-1',
    name: 'Mock Recipe',
    cookTime: '30 min',
    category: 'Dinner',
    ingredients: [],
    instructions: [],
    ...overrides,
  };
}

describe('useRecipes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
  });

  describe('guest mode: addRecipe', () => {
    it('should add returned recipe to recipes list after addRecipe', async () => {
      const newRecipe = createMockRecipe({ id: 'new-1', name: 'Added Recipe' });
      const mockService = {
        getRecipes: jest.fn().mockResolvedValue([]),
        createRecipe: jest.fn().mockResolvedValue(newRecipe),
        updateRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
      };
      createRecipeService.mockReturnValue(mockService);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addRecipe({ name: 'Added Recipe' });
      });

      expect(mockService.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Added Recipe' }),
      );
      expect(result.current.recipes).toContainEqual(
        expect.objectContaining({ id: 'new-1', name: 'Added Recipe' }),
      );
    });
  });

  describe('guest mode: updateRecipe', () => {
    it('should replace recipe in list with updated recipe after updateRecipe', async () => {
      const initialRecipe = createMockRecipe({ id: 'r-1', name: 'Original' });
      const updatedRecipe = createMockRecipe({
        id: 'r-1',
        name: 'Updated Name',
      });
      const mockService = {
        getRecipes: jest.fn().mockResolvedValue([initialRecipe]),
        createRecipe: jest.fn(),
        updateRecipe: jest.fn().mockResolvedValue(updatedRecipe),
        deleteRecipe: jest.fn(),
      };
      createRecipeService.mockReturnValue(mockService);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(1);
        expect(result.current.recipes[0].name).toBe('Original');
      });

      await act(async () => {
        await result.current.updateRecipe('r-1', { name: 'Updated Name' });
      });

      expect(mockService.updateRecipe).toHaveBeenCalledWith(
        'r-1',
        expect.objectContaining({ name: 'Updated Name' }),
      );
      expect(result.current.recipes).toHaveLength(1);
      expect(result.current.recipes[0].name).toBe('Updated Name');
    });
  });
});
