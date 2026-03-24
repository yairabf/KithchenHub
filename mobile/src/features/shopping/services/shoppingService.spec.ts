// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock the api client. ApiError and NetworkError are defined inside the factory
// so Jest's module-hoisting can access them; this makes instanceof checks in
// apiErrorGuards.ts resolve correctly because both the guard and the test
// import from the same mocked module.
jest.mock('../../../services/api', () => {
    class ApiError extends Error {
        public statusCode: number;
        constructor(message: string, statusCode: number) {
            super(message);
            this.name = 'ApiError';
            this.statusCode = statusCode;
        }
    }
    class NetworkError extends Error {
        constructor(message: string) {
            super(message);
            this.name = 'NetworkError';
        }
    }
    return {
        ApiError,
        NetworkError,
        api: {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            patch: jest.fn(),
        },
    };
});

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
    getGroceryItems: jest.fn().mockResolvedValue([]),
    getCatalogData: jest.fn().mockResolvedValue({
      groceryItems: [],
      categories: [],
      frequentlyAddedItems: [],
    }),
  },
}));

jest.mock('../../../i18n', () => ({
  i18n: {
    language: 'en',
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
import { api, ApiError } from '../../../services/api';
import { catalogService } from '../../../common/services/catalogService';

const mockedI18n = require('../../../i18n').i18n as { language: string };

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

    describe('RemoteShoppingService', () => {
        let service: RemoteShoppingService;

        beforeEach(() => {
            service = new RemoteShoppingService();
            jest.clearAllMocks();
            mockedI18n.language = 'en';
            (catalogService.getGroceryItems as jest.Mock).mockResolvedValue([]);
        });

        it('getShoppingData uses the aggregate endpoint with the current language', async () => {
            mockedI18n.language = 'he-IL';
            (api.get as jest.Mock).mockImplementation((url: string) => {
                if (url === '/shopping-lists/aggregate?lang=he-il') {
                    return Promise.resolve({
                        lists: [
                            {
                                id: 'list-1',
                                name: 'Main',
                                isMain: true,
                                itemCount: 1,
                            },
                        ],
                        items: [
                            {
                                listId: 'list-1',
                                id: 'item-1',
                                name: 'עגבנייה',
                                quantity: 1,
                                isChecked: false,
                            },
                        ],
                    });
                }

                return Promise.resolve([]);
            });

            const data = await service.getShoppingData();

            expect(api.get).toHaveBeenCalledWith('/shopping-lists/aggregate?lang=he-il');
            expect(data.shoppingItems[0]?.name).toBe('עגבנייה');
        });

        it('getShoppingData falls back to legacy per-list fetch when aggregate returns 404', async () => {
            mockedI18n.language = 'en';
            (api.get as jest.Mock).mockImplementation((url: string) => {
                if (url.startsWith('/shopping-lists/aggregate')) {
                    return Promise.reject(new ApiError('Not Found', 404));
                }

                if (url === '/shopping-lists') {
                    return Promise.resolve([
                        { id: 'list-1', name: 'Main', isMain: true, itemCount: 1 },
                    ]);
                }

                if (url === '/shopping-lists/list-1?lang=en') {
                    return Promise.resolve({
                        id: 'list-1',
                        name: 'Main',
                        items: [{ id: 'item-1', name: 'Milk', quantity: 1, isChecked: false }],
                    });
                }

                return Promise.resolve([]);
            });

            const data = await service.getShoppingData();

            expect(api.get).toHaveBeenCalledWith('/shopping-lists/aggregate?lang=en');
            expect(api.get).toHaveBeenCalledWith('/shopping-lists');
            expect(data.shoppingItems[0]?.name).toBe('Milk');
        });
    });
});
