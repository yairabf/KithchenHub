import { CacheAwareShoppingRepository } from '../cacheAwareShoppingRepository';
import { getCached } from '../cacheAwareRepository';
import { getIsOnline } from '../../utils/networkStatus';
import { api } from '../../../services/api';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

jest.mock('../cacheAwareRepository', () => ({
  getCached: jest.fn(),
  invalidateCache: jest.fn(),
  readCachedEntitiesForUpdate: jest.fn(),
  addEntityToCache: jest.fn(),
  updateEntityInCache: jest.fn(),
  setCached: jest.fn(),
}));

jest.mock('../../utils/networkStatus', () => ({
  getIsOnline: jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  NetworkError: class NetworkError extends Error {},
}));

jest.mock('../../utils/cacheEvents', () => ({
  cacheEvents: {
    emitCacheChange: jest.fn(),
  },
}));

jest.mock('../../utils/syncQueueStorage', () => ({
  syncQueueStorage: {
    enqueue: jest.fn(),
  },
}));

jest.mock('../../utils/syncQueueProcessor', () => ({
  getSyncQueueProcessor: jest.fn(() => ({
    processQueue: jest.fn(),
  })),
}));

jest.mock('../../services/catalogService', () => ({
  catalogService: {
    getGroceryItems: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../features/shopping/utils/shoppingRealtime', () => ({
  applyShoppingListChange: jest.fn(),
  applyShoppingItemChange: jest.fn(),
}));

describe('CacheAwareShoppingRepository list mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getIsOnline as jest.Mock).mockReturnValue(true);
    (getCached as jest.Mock).mockImplementation(
      async (_entityType, fetcher: () => Promise<unknown>) => fetcher(),
    );
  });

  it('preserves the backend isMain flag when loading shopping lists', async () => {
    (api.get as jest.Mock).mockResolvedValue([
      {
        id: 'list-1',
        name: 'Main List',
        color: '#10B981',
        itemCount: 3,
        isMain: true,
      },
    ]);

    const repository = new CacheAwareShoppingRepository({} as never);

    const lists = await repository.findAllLists();

    expect(lists).toEqual([
      expect.objectContaining({
        id: 'list-1',
        name: 'Main List',
        isMain: true,
        itemCount: 3,
      }),
    ]);
  });
});
