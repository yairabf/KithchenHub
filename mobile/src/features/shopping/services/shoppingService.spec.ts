// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock the api client
jest.mock('../../../services/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
    },
}));

// Mock AsyncStorage (required by catalogService)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock devMode to prevent seeding in tests (must be before LocalShoppingService import)
jest.mock('../../../common/utils/devMode', () => ({
  isDevMode: jest.fn(() => false),
}));

// Mock config to prevent seeding in tests (must be before LocalShoppingService import)
jest.mock('../../../config', () => ({
  config: {
    mockData: {
      enabled: false,
    },
  },
}));

// Mock catalogService (LocalShoppingService now uses it)
jest.mock('../../../common/services/catalogService', () => ({
  catalogService: {
    getCatalogData: jest.fn().mockResolvedValue({
      groceryItems: [],
      categories: [],
      frequentlyAddedItems: [],
    }),
  },
}));

// Mock guestStorage
jest.mock('../../../common/utils/guestStorage', () => ({
    guestStorage: {
        getShoppingLists: jest.fn().mockResolvedValue([]),
        getShoppingItems: jest.fn().mockResolvedValue([]),
        saveShoppingLists: jest.fn().mockResolvedValue(undefined),
        saveShoppingItems: jest.fn().mockResolvedValue(undefined),
    },
}));

// Import after mocks are set up
import {
  createShoppingService,
} from './shoppingService';
import { LocalShoppingService } from './LocalShoppingService';
import { RemoteShoppingService } from './RemoteShoppingService';
import { guestStorage } from '../../../common/utils/guestStorage';
import { mockShoppingLists, mockItems } from '../../../mocks/shopping';
import { api } from '../../../services/api';

describe('createShoppingService', () => {
  describe.each([
    ['guest mode', 'guest', LocalShoppingService],
    ['signed-in mode', 'signed-in', RemoteShoppingService],
  ])('when %s', (_label, mode, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createShoppingService(mode as 'guest' | 'signed-in');

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});

describe('Shopping Services', () => {
    describe('LocalShoppingService', () => {
        let service: LocalShoppingService;

        beforeEach(() => {
            service = new LocalShoppingService();
            jest.clearAllMocks();
        });

        it('getShoppingData returns data from guestStorage', async () => {
            (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue(mockShoppingLists);
            (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue(mockItems);

            const data = await service.getShoppingData();

            expect(data.shoppingLists).toEqual(mockShoppingLists);
            expect(data.shoppingItems).toEqual(mockItems);
            expect(guestStorage.getShoppingLists).toHaveBeenCalled();
            expect(guestStorage.getShoppingItems).toHaveBeenCalled();
        });

        it('getShoppingData returns empty arrays when no guest data exists', async () => {
            (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
            (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);

            const data = await service.getShoppingData();

            expect(data.shoppingLists).toEqual([]);
            expect(data.shoppingItems).toEqual([]);
            expect(guestStorage.getShoppingLists).toHaveBeenCalled();
            expect(guestStorage.getShoppingItems).toHaveBeenCalled();
        });

        it('getShoppingData still includes reference data (categories, groceryItems)', async () => {
            (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
            (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);

            const data = await service.getShoppingData();

            expect(data.categories).toBeDefined();
            expect(data.groceryItems).toBeDefined();
            expect(data.frequentlyAddedItems).toBeDefined();
        });
    });
});
