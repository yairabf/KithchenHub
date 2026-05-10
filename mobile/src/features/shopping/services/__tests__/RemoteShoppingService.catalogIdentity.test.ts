import { RemoteShoppingService } from '../RemoteShoppingService';
import { api } from '../../../../services/api';
import { catalogService } from '../../../../common/services/catalogService';

jest.mock('../../../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../../common/services/catalogService', () => ({
  catalogService: {
    getGroceryItems: jest.fn(),
  },
}));

jest.mock('../../../../i18n', () => ({
  i18n: {
    language: 'en',
  },
}));

describe('RemoteShoppingService catalog identity mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses catalogItemId to preserve image/category even when names differ', async () => {
    (catalogService.getGroceryItems as jest.Mock).mockResolvedValue([
      {
        id: 'catalog-black-pepper',
        name: 'Black Pepper',
        category: 'spices',
        image: 'pepper.png',
        defaultQuantity: 1,
      },
    ]);

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/shopping-lists/aggregate')) {
        return Promise.resolve({
          lists: [
            {
              id: 'list-1',
              name: 'Main List',
              isMain: true,
              itemCount: 1,
            },
          ],
          items: [
            {
              id: 'item-1',
              listId: 'list-1',
              catalogItemId: 'catalog-black-pepper',
              name: 'פלפל שחור',
              quantity: 1,
              category: null,
              image: null,
              isChecked: false,
            },
          ],
        });
      }

      if (url.startsWith('/shopping-items/frequent')) {
        return Promise.resolve({ items: [] });
      }

      throw new Error(`Unexpected api.get call: ${url}`);
    });

    const service = new RemoteShoppingService();

    const result = await service.getShoppingData();

    expect(result.shoppingItems[0]).toEqual(
      expect.objectContaining({
        id: 'item-1',
        catalogItemId: 'catalog-black-pepper',
        name: 'פלפל שחור',
        image: 'pepper.png',
        category: 'spices',
      }),
    );
  });
});
