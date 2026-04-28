import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

const mockService = {
  getShoppingData: jest.fn(),
  createList: jest.fn(),
  updateList: jest.fn(),
  deleteList: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  toggleItem: jest.fn(),
};

const mockRepository = {
  findAllLists: jest.fn(),
  findAllItems: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
};

const mockCacheChangeHandlers: Record<string, Array<() => void>> = {
  shoppingItems: [],
  shoppingLists: [],
};

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      name: 'Yair',
      isGuest: false,
      householdId: 'household-1',
    },
  }),
}));

jest.mock('../../../../common/hooks', () => ({
  useDebouncedRemoteSearch: () => ({ results: [] }),
  useResponsive: () => ({ isTablet: false }),
}));

jest.mock('../../../../common/hooks/useCatalog', () => ({
  useCatalog: () => ({ searchGroceries: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../../hooks/useDashboardChores', () => ({
  useDashboardChores: () => ({
    todayChores: [],
    toggleChore: jest.fn(),
    refresh: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../../../../common/components/ScreenHeader', () => ({
  ScreenHeader: () => null,
}));

jest.mock('../../../../common/components/Toast', () => ({
  Toast: () => null,
}));

jest.mock('../../components/ImportantChoresCard', () => ({
  ImportantChoresCard: () => null,
}));

jest.mock('../../components/QuickAddCard', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    QuickAddCard: () => React.createElement(Text, null, 'Quick Add'),
  };
});

jest.mock('../../components/FrequentlyAddedSection', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');

  return {
    FrequentlyAddedSection: ({ items, onItemPress }: { items: Array<{ id: string; name: string }>; onItemPress: (item: { id: string; name: string }) => void }) => (
      React.createElement(
        View,
        null,
        items.map((item) => React.createElement(Text, { key: item.id }, item.name)),
        items[0]
          ? React.createElement(
              TouchableOpacity,
              { onPress: () => onItemPress(items[0]), accessibilityLabel: 'press frequent item' },
              React.createElement(Text, null, 'Frequent item'),
            )
          : null,
      )
    ),
  };
});

jest.mock('../../../../common/utils/avatarUtils', () => ({
  getAssigneeAvatarUri: () => '',
}));

jest.mock('../../../../common/types/dataModes', () => ({
  determineUserDataMode: () => 'signed-in',
}));

jest.mock('../../../../config', () => ({
  config: {
    mockData: {
      enabled: false,
    },
  },
}));

jest.mock('../../../shopping/services/shoppingService', () => ({
  createShoppingService: jest.fn(() => mockService),
}));

jest.mock('../../../../common/repositories/cacheAwareShoppingRepository', () => ({
  CacheAwareShoppingRepository: jest.fn(() => mockRepository),
}));

jest.mock('../../../../common/utils/cacheEvents', () => ({
  cacheEvents: {
    onCacheChange: jest.fn((entityType: 'shoppingItems' | 'shoppingLists', handler: () => void) => {
      mockCacheChangeHandlers[entityType].push(handler);
      return () => {
        mockCacheChangeHandlers[entityType] = mockCacheChangeHandlers[entityType].filter(
          (registeredHandler) => registeredHandler !== handler,
        );
      };
    }),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => options?.name ? `${key}:${options.name}` : key,
    i18n: {
      dir: () => 'ltr',
      language: 'en',
    },
  }),
}));

describe('DashboardScreen frequent item adds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheChangeHandlers.shoppingItems = [];
    mockCacheChangeHandlers.shoppingLists = [];

    mockRepository.findAllLists.mockResolvedValue([
      {
        id: 'list-1',
        localId: 'list-1',
        name: 'Main List',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#10B981',
        isMain: true,
      },
    ]);
    mockRepository.findAllItems.mockResolvedValue([]);
    mockRepository.createItem.mockResolvedValue({
      id: 'item-1',
      localId: 'item-1',
      listId: 'list-1',
      name: 'Milk',
      quantity: 1,
      category: 'Dairy',
      image: '',
      isChecked: false,
    });
    mockRepository.updateItem.mockResolvedValue({
      id: 'item-1',
      localId: 'item-1',
      listId: 'list-1',
      name: 'Milk',
      quantity: 2,
      category: 'Dairy',
      image: '',
      isChecked: false,
    });

    mockService.getShoppingData.mockResolvedValue({
      shoppingLists: [
        {
          id: 'list-1',
          localId: 'list-1',
          name: 'Main List',
          itemCount: 0,
          icon: 'cart-outline',
          color: '#10B981',
          isMain: true,
        },
      ],
      shoppingItems: [],
      categories: [],
      groceryItems: [],
      frequentlyAddedItems: [
        {
          id: 'milk-1',
          name: 'Milk',
          category: 'Dairy',
          image: '',
          defaultQuantity: 1,
        },
      ],
    });
  });

  it('ignores stale frequent-item responses when overlapping reloads resolve out of order', async () => {
    let resolveFirstRequest: ((value: any) => void) | undefined;
    let resolveSecondRequest: ((value: any) => void) | undefined;

    mockService.getShoppingData
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstRequest = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondRequest = resolve;
          }),
      );

    const { queryByText, getByText } = render(
      <DashboardScreen
        onOpenShoppingModal={jest.fn()}
        onOpenChoresModal={jest.fn()}
        onNavigateToTab={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockCacheChangeHandlers.shoppingItems).toHaveLength(1);
    });

    act(() => {
      mockCacheChangeHandlers.shoppingItems[0]?.();
    });

    await waitFor(() => {
      expect(mockService.getShoppingData).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      resolveSecondRequest?.({
        shoppingLists: [
          {
            id: 'list-1',
            localId: 'list-1',
            name: 'Main List',
            itemCount: 1,
            icon: 'cart-outline',
            color: '#10B981',
            isMain: true,
          },
        ],
        shoppingItems: [],
        categories: [],
        groceryItems: [],
        frequentlyAddedItems: [
          {
            id: 'milk-1',
            name: 'Milk',
            category: 'Dairy',
            image: '',
            defaultQuantity: 1,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
    });

    await act(async () => {
      resolveFirstRequest?.({
        shoppingLists: [
          {
            id: 'list-1',
            localId: 'list-1',
            name: 'Main List',
            itemCount: 0,
            icon: 'cart-outline',
            color: '#10B981',
            isMain: true,
          },
        ],
        shoppingItems: [],
        categories: [],
        groceryItems: [],
        frequentlyAddedItems: [],
      });
    });

    expect(queryByText('Milk')).toBeTruthy();
  });

  it('refetches backend frequent items when shopping cache changes so newly counted items appear on the dashboard', async () => {
    mockService.getShoppingData
      .mockResolvedValueOnce({
        shoppingLists: [
          {
            id: 'list-1',
            localId: 'list-1',
            name: 'Main List',
            itemCount: 0,
            icon: 'cart-outline',
            color: '#10B981',
            isMain: true,
          },
        ],
        shoppingItems: [],
        categories: [],
        groceryItems: [],
        frequentlyAddedItems: [],
      })
      .mockResolvedValueOnce({
        shoppingLists: [
          {
            id: 'list-1',
            localId: 'list-1',
            name: 'Main List',
            itemCount: 1,
            icon: 'cart-outline',
            color: '#10B981',
            isMain: true,
          },
        ],
        shoppingItems: [],
        categories: [],
        groceryItems: [],
        frequentlyAddedItems: [
          {
            id: 'milk-1',
            name: 'Milk',
            category: 'Dairy',
            image: '',
            defaultQuantity: 1,
          },
        ],
      });

    const { queryByText, getByText } = render(
      <DashboardScreen
        onOpenShoppingModal={jest.fn()}
        onOpenChoresModal={jest.fn()}
        onNavigateToTab={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockService.getShoppingData).toHaveBeenCalledTimes(1);
    });
    expect(queryByText('Milk')).toBeNull();

    await waitFor(() => {
      expect(mockCacheChangeHandlers.shoppingItems).toHaveLength(1);
    });

    mockCacheChangeHandlers.shoppingItems[0]?.();

    await waitFor(() => {
      expect(mockService.getShoppingData).toHaveBeenCalledTimes(2);
      expect(getByText('Milk')).toBeTruthy();
    });
  });

  it('uses the shared shopping repository for signed-in frequent-item taps so shopping tab state updates immediately', async () => {
    const { getByLabelText } = render(
      <DashboardScreen
        onOpenShoppingModal={jest.fn()}
        onOpenChoresModal={jest.fn()}
        onNavigateToTab={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockRepository.findAllLists).toHaveBeenCalled();
      expect(mockService.getShoppingData).toHaveBeenCalled();
    });

    fireEvent.press(getByLabelText('press frequent item'));

    await waitFor(() => {
      expect(mockRepository.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          listId: 'list-1',
          name: 'Milk',
          quantity: 1,
        }),
      );
    });

    expect(mockService.createItem).not.toHaveBeenCalled();
  });
});
