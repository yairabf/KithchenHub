import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ShoppingListsScreen } from '../ShoppingListsScreen';

const mockFindAllLists = jest.fn();
const mockFindAllItems = jest.fn();
const mockTranslateShoppingItemNames = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { dir: () => 'ltr', language: 'en' },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', householdId: 'household-1', email: 'test@example.com' },
    isLoading: false,
  }),
}));

jest.mock('../../../../common/services/catalogService', () => ({
  catalogService: {
    clearCache: jest.fn(),
    getShoppingCategories: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../../common/hooks/useCatalog', () => ({
  useCatalog: () => ({
    groceryItems: [],
    categories: [],
    frequentlyAddedItems: [],
    searchGroceries: jest.fn(),
    getGroceriesByCategory: jest.fn(),
    getCatalogDisplayNames: jest.fn(),
  }),
}));

jest.mock('../../../../common/hooks', () => ({
  useDebouncedRemoteSearch: () => ({ results: [] }),
  useResponsive: () => ({ isTablet: false }),
}));

jest.mock('../../hooks/useShoppingRealtime', () => ({
  useShoppingRealtime: () => ({ isSubscribed: true, error: null }),
}));

jest.mock('../styles', () => ({ styles: new Proxy({}, { get: () => ({}) }) }));

jest.mock('../../components/ShoppingListPanel', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    ShoppingListPanel: ({ filteredItems }: { filteredItems: Array<{ id: string; name: string }> }) => (
      <View>
        {filteredItems.map((item) => (
          <Text key={item.id}>{item.name}</Text>
        ))}
      </View>
    ),
  };
});

jest.mock('../../components/CategoryModal', () => ({ CategoryModal: () => null }));
jest.mock('../../components/CategoriesGrid', () => ({ CategoriesGrid: () => null }));
jest.mock('../../components/FrequentlyAddedGrid', () => ({ FrequentlyAddedGrid: () => null }));
jest.mock('../../../../common/components/CenteredModal', () => ({ CenteredModal: () => null }));
jest.mock('../../../../common/components/ShareModal', () => ({ ShareModal: () => null }));
jest.mock('../../../../common/components/ConfirmationModal', () => ({ ConfirmationModal: () => null }));
jest.mock('../../../../common/components/ScreenHeader', () => ({ ScreenHeader: () => null }));
jest.mock('../../components/GrocerySearchBar', () => ({ GrocerySearchBar: () => null }));
jest.mock('../../components/CreateCustomItemModal', () => ({ CreateCustomItemModal: () => null }));
jest.mock('../../components/CreateListModal', () => ({ CreateListModal: () => null }));

jest.mock('../../services/shoppingService', () => ({
  createShoppingService: jest.fn(() => ({
    getShoppingData: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    toggleItem: jest.fn(),
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
  })),
}));

jest.mock('../../../../common/repositories/cacheAwareShoppingRepository', () => ({
  CacheAwareShoppingRepository: jest.fn().mockImplementation(() => ({
    findAllLists: mockFindAllLists,
    findAllItems: mockFindAllItems,
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    toggleItem: jest.fn(),
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
    refreshAll: jest.fn(),
  })),
}));

jest.mock('../../utils/catalogTranslation', () => ({
  translateShoppingItemNames: (...args: unknown[]) => mockTranslateShoppingItemNames(...args),
}));

describe('ShoppingListsScreen snappiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFindAllLists.mockResolvedValue([
      {
        id: 'list-1',
        localId: 'list-1',
        name: 'Main List',
        itemCount: 1,
        icon: 'cart-outline',
        color: '#4CAF50',
        isMain: true,
      },
    ]);

    mockFindAllItems.mockResolvedValue([
      {
        id: 'item-1',
        localId: 'item-1',
        name: 'Milk',
        listId: 'list-1',
        quantity: 1,
        category: 'Dairy',
        isChecked: false,
        catalogItemId: 'g27',
      },
    ]);

    mockTranslateShoppingItemNames.mockImplementation(
      () => new Promise(() => {})
    );
  });

  it('renders cached shopping items immediately without waiting for translation fetches', async () => {
    const { findByText } = render(<ShoppingListsScreen />);

    await waitFor(async () => {
      expect(await findByText('Milk')).toBeTruthy();
    });

    expect(mockTranslateShoppingItemNames).toHaveBeenCalled();
  });
});
