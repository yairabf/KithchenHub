import {
  createShoppingService,
  LocalShoppingService,
  RemoteShoppingService,
} from './shoppingService';
import { guestStorage } from '../../../common/utils/guestStorage';
import { mockShoppingLists, mockItems } from '../../../mocks/shopping';

// Mock guestStorage
jest.mock('../../../common/utils/guestStorage', () => ({
    guestStorage: {
        getShoppingLists: jest.fn().mockResolvedValue([]),
        getShoppingItems: jest.fn().mockResolvedValue([]),
        saveShoppingLists: jest.fn().mockResolvedValue(undefined),
        saveShoppingItems: jest.fn().mockResolvedValue(undefined),
    },
}));

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
