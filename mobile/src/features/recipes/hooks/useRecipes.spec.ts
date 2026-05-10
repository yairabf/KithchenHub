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

jest.mock('../../../common/services/recipeImageCache', () => ({
  pruneStaleImages: jest.fn().mockResolvedValue(undefined),
}));

import { useRecipes } from './useRecipes';

const mockUseAuth = jest.requireMock('../../../contexts/AuthContext').useAuth;
const createRecipeService = jest.requireMock('../services/recipeService').createRecipeService;
const mockUseCachedEntities = jest.requireMock('../../../common/hooks/useCachedEntities').useCachedEntities;
const MockCacheAwareRecipeRepository = jest.requireMock('../../../common/repositories/cacheAwareRecipeRepository').CacheAwareRecipeRepository;

function createMockRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'mock-1',
    localId: 'local-1',
    name: 'Mock Recipe',
    prepTime: 30,
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
    mockUseCachedEntities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    MockCacheAwareRecipeRepository.mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      refresh: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }));
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

  describe('signed-in cache behavior', () => {
    it('does not auto-refresh cached signed-in recipes on first render', async () => {
      const originalConfig = jest.requireMock('../../../config').config;
      originalConfig.mockData.enabled = false;

      const cachedRecipe = createMockRecipe({ id: 'signed-in-1', name: 'Cached Recipe' });
      const mockRepository = {
        findAll: jest.fn().mockResolvedValue([cachedRecipe]),
        findById: jest.fn().mockResolvedValue(cachedRecipe),
        refresh: jest.fn().mockResolvedValue([cachedRecipe]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', householdId: 'household-1', isGuest: false },
        isLoading: false,
      });
      mockUseCachedEntities.mockReturnValue({
        data: [cachedRecipe],
        isLoading: false,
        error: null,
      });
      MockCacheAwareRecipeRepository.mockImplementation(() => mockRepository);
      createRecipeService.mockReturnValue({ getRecipes: jest.fn() });

      renderHook(() => useRecipes());

      await waitFor(() => {
        expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      });

      expect(mockRepository.refresh).not.toHaveBeenCalled();

      originalConfig.mockData.enabled = true;
    });
  });
});
