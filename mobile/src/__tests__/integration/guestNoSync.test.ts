import { api } from '../../services/api';
import { createShoppingService } from '../../features/shopping/services/shoppingService';
import { createRecipeService } from '../../features/recipes/services/recipeService';
import { createChoresService } from '../../features/chores/services/choresService';
import { determineUserDataMode } from '../../common/types/dataModes';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock api methods
jest.mock('../../services/api', () => {
  const mockRequest = jest.fn();
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockPatch = jest.fn();
  const mockDelete = jest.fn();

  return {
    api: {
      request: mockRequest,
      get: mockGet,
      post: mockPost,
      put: mockPut,
      patch: mockPatch,
      delete: mockDelete,
    },
  };
});

type ServiceConfig = {
  serviceName: string;
  createService: (mode: 'guest' | 'signed-in') => { getShoppingData?: () => Promise<unknown>; getRecipes?: () => Promise<unknown>; getChores?: () => Promise<unknown> };
  callMethod: (service: ReturnType<typeof createShoppingService | typeof createRecipeService | typeof createChoresService>) => Promise<unknown>;
  mockApiResponse: () => void;
};

describe('Guest Mode No-Sync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const serviceConfigs: ServiceConfig[] = [
    {
      serviceName: 'Shopping',
      createService: createShoppingService,
      callMethod: (service) => service.getShoppingData(),
      mockApiResponse: () => {
        (api.get as jest.Mock)
          .mockResolvedValueOnce([]) // groceries/search
          .mockResolvedValueOnce([]) // shopping-lists
          .mockResolvedValueOnce([]); // shopping-lists/:id/items
      },
    },
    {
      serviceName: 'Recipe',
      createService: createRecipeService,
      callMethod: (service) => service.getRecipes(),
      mockApiResponse: () => {
        (api.get as jest.Mock).mockResolvedValue([]);
      },
    },
    {
      serviceName: 'Chores',
      createService: createChoresService,
      callMethod: (service) => service.getChores(),
      mockApiResponse: () => {
        (api.get as jest.Mock).mockResolvedValue({
          today: [],
          upcoming: [],
        });
      },
    },
  ];

  describe.each(serviceConfigs)('$serviceName Service', ({ serviceName, createService, callMethod, mockApiResponse }) => {
    it('should never call api.request when user is in guest mode', async () => {
      const guestUser = { id: 'guest-1', email: '', name: 'Guest', isGuest: true };
      const userMode = determineUserDataMode(guestUser);

      // Create service - should be local service, not remote
      const service = createService(userMode);

      // Attempt operations that would trigger API calls
      await callMethod(service);

      // Assert api.request was never called
      expect(api.request).not.toHaveBeenCalled();
      expect(api.get).not.toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should call api.request when user is signed-in', async () => {
      const signedInUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'User',
        isGuest: false,
      };
      const userMode = determineUserDataMode(signedInUser);

      // Mock successful API responses
      mockApiResponse();

      const service = createService(userMode);
      await callMethod(service);

      // Assert api was called
      expect(api.get).toHaveBeenCalled();
    });
  });
});
