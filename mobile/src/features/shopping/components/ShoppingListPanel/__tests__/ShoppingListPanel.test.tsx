/**
 * ShoppingListPanel Component Tests
 *
 * Covers rendering of list header, list selector, shopping item cards with
 * quantity controls, and ensures sync status indicator is not shown on items.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ShoppingListPanel } from '../ShoppingListPanel';
import type { ShoppingItem, ShoppingList } from '../../../../../mocks/shopping';
import type { GroceryItem } from '../../GrocerySearchBar';

jest.mock('../../../../../common/components/SwipeableWrapper', () => ({
  SwipeableWrapper: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../GrocerySearchBar', () => ({
  GrocerySearchBar: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockList: ShoppingList = {
  id: 'list-1',
  localId: 'local-1',
  name: 'Weekly Shopping',
  itemCount: 2,
  icon: 'cart-outline',
  color: '#4CAF50',
  isMain: true,
};

const mockItems: ShoppingItem[] = [
  {
    id: 'item-1',
    localId: 'local-item-1',
    name: 'Milk',
    image: '',
    quantity: 2,
    category: 'Dairy',
    listId: 'list-1',
    isChecked: false,
  },
  {
    id: 'item-2',
    localId: 'local-item-2',
    name: 'Bread',
    image: '',
    quantity: 1,
    category: 'Bakery',
    listId: 'list-1',
    isChecked: true,
  },
];

const mockGroceryItems: GroceryItem[] = [];

const defaultProps = {
  shoppingLists: [mockList],
  selectedList: mockList,
  filteredItems: mockItems,
  groceryItems: mockGroceryItems,
  onSelectList: jest.fn(),
  onCreateList: jest.fn(),
  onSelectGroceryItem: jest.fn(),
  onQuickAddItem: jest.fn(),
  onQuantityChange: jest.fn(),
  onDeleteItem: jest.fn(),
  onToggleItemChecked: jest.fn(),
};

describe('ShoppingListPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list header with My Lists label', () => {
    const { getByText } = render(<ShoppingListPanel {...defaultProps} />);
    expect(getByText('My Lists')).toBeTruthy();
  });

  it('should render selected list name in drawer', () => {
    const { getByText } = render(<ShoppingListPanel {...defaultProps} />);
    expect(getByText('Weekly Shopping')).toBeTruthy();
  });

  it('should render one card per filtered item', () => {
    const { getByText } = render(<ShoppingListPanel {...defaultProps} />);
    expect(getByText('Milk')).toBeTruthy();
    expect(getByText('Bread')).toBeTruthy();
  });

  it('should render quantity controls for each item (quantity visible)', () => {
    const { getByText } = render(<ShoppingListPanel {...defaultProps} />);
    expect(getByText('2')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('should not render sync status indicator on items', () => {
    const { queryByText } = render(<ShoppingListPanel {...defaultProps} />);
    expect(queryByText('Pending')).toBeNull();
    expect(queryByText('Failed')).toBeNull();
  });

  it('should render New List button', () => {
    const { getByText } = render(<ShoppingListPanel {...defaultProps} />);
    expect(getByText('New List')).toBeTruthy();
  });

  describe.each([
    ['empty filtered list', []],
    ['single item', [mockItems[0]]],
    ['multiple items', mockItems],
  ])('with %s', (_, filteredItems) => {
    it('should render without error', () => {
      const { getByText } = render(
        <ShoppingListPanel {...defaultProps} filteredItems={filteredItems} />
      );
      expect(getByText('My Lists')).toBeTruthy();
    });
  });
});
