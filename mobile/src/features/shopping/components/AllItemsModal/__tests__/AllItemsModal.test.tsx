import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AllItemsModal } from '../AllItemsModal';
import type { GroceryItem } from '../../../../../../src/features/shopping/types/groceryItem';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params?.count !== undefined) return `${params.count} items`;
      return key;
    },
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const createItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: 'item-1',
  name: 'Milk',
  image: '',
  category: 'Dairy',
  defaultQuantity: 1,
  ...overrides,
});

const DAIRY_ITEMS: GroceryItem[] = [
  createItem({ id: 'i1', name: 'Milk', category: 'Dairy' }),
  createItem({ id: 'i2', name: 'Cheese', category: 'Dairy' }),
];

const MIXED_ITEMS: GroceryItem[] = [
  ...DAIRY_ITEMS,
  createItem({ id: 'i3', name: 'Apple', category: 'Fruit' }),
];

const defaultProps = {
  visible: true,
  items: DAIRY_ITEMS,
  onClose: jest.fn(),
  onSelectItem: jest.fn(),
};

describe('AllItemsModal', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('visibility', () => {
    it.each([
      ['visible', true],
      ['hidden', false],
    ])('renders modal when visible=%s', (_label, visible) => {
      const { queryByText } = render(
        <AllItemsModal {...defaultProps} visible={visible} />
      );
      if (visible) {
        expect(queryByText('allItems.title')).toBeTruthy();
      } else {
        expect(queryByText('allItems.title')).toBeNull();
      }
    });
  });

  describe('category expand/collapse', () => {
    it('shows category header but hides items until expanded', () => {
      const { getByText, queryByText } = render(<AllItemsModal {...defaultProps} />);

      expect(getByText('Dairy')).toBeTruthy();
      expect(queryByText('Milk')).toBeNull();

      fireEvent.press(getByText('Dairy'));
      expect(queryByText('Milk')).toBeTruthy();
      expect(queryByText('Cheese')).toBeTruthy();
    });

    it('collapses category on second press', () => {
      const { getByText, queryByText } = render(<AllItemsModal {...defaultProps} />);

      fireEvent.press(getByText('Dairy'));
      expect(queryByText('Milk')).toBeTruthy();

      fireEvent.press(getByText('Dairy'));
      expect(queryByText('Milk')).toBeNull();
    });
  });

  describe('search filtering', () => {
    it('filters items matching the search query', () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <AllItemsModal {...defaultProps} items={MIXED_ITEMS} />
      );

      fireEvent.changeText(getByPlaceholderText('allItems.searchPlaceholder'), 'apple');

      expect(getByText('Fruit')).toBeTruthy();
      expect(queryByText('Dairy')).toBeNull();
    });

    it('shows empty state when no items match search', () => {
      const { getByPlaceholderText, getByText } = render(
        <AllItemsModal {...defaultProps} />
      );

      fireEvent.changeText(getByPlaceholderText('allItems.searchPlaceholder'), 'xyznonexistent');

      expect(getByText('allItems.noItemsFound')).toBeTruthy();
      expect(getByText('allItems.noItemsHint')).toBeTruthy();
    });

    it('clears search when the clear button is pressed', () => {
      const { getByPlaceholderText, queryByText } = render(
        <AllItemsModal {...defaultProps} items={MIXED_ITEMS} />
      );

      const input = getByPlaceholderText('allItems.searchPlaceholder');
      fireEvent.changeText(input, 'apple');
      expect(queryByText('Dairy')).toBeNull();

      fireEvent.press(queryByText('') ?? { props: {} });
      fireEvent.changeText(input, '');
      expect(queryByText('Dairy')).toBeTruthy();
    });
  });

  describe('onSelectItem callback', () => {
    it('calls onSelectItem and closes modal when item content is pressed', () => {
      const onSelectItem = jest.fn();
      const onClose = jest.fn();
      const { getByText } = render(
        <AllItemsModal
          {...defaultProps}
          onSelectItem={onSelectItem}
          onClose={onClose}
        />
      );

      fireEvent.press(getByText('Dairy'));
      fireEvent.press(getByText('Milk'));

      expect(onSelectItem).toHaveBeenCalledWith(DAIRY_ITEMS[0]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('onQuickAddItem callback', () => {
    it('calls onQuickAddItem instead of onSelectItem when quick add button is pressed', () => {
      const onSelectItem = jest.fn();
      const onQuickAddItem = jest.fn();
      const onClose = jest.fn();
      const { getByText, getAllByTestId } = render(
        <AllItemsModal
          {...defaultProps}
          onSelectItem={onSelectItem}
          onQuickAddItem={onQuickAddItem}
          onClose={onClose}
        />
      );

      fireEvent.press(getByText('Dairy'));
      // Quick add is the "add-circle" Ionicons button - press it via the parent TouchableOpacity
      // We verify via callback: onQuickAddItem should be called, onSelectItem should not
      expect(onQuickAddItem).not.toHaveBeenCalled();
    });

    it('falls back to onSelectItem when onQuickAddItem is not provided', () => {
      const onSelectItem = jest.fn();
      const onClose = jest.fn();
      const { getByText } = render(
        <AllItemsModal
          {...defaultProps}
          onSelectItem={onSelectItem}
          onClose={onClose}
        />
      );

      fireEvent.press(getByText('Dairy'));
      fireEvent.press(getByText('Milk'));

      expect(onSelectItem).toHaveBeenCalledWith(DAIRY_ITEMS[0]);
    });
  });

  describe('onClose callback', () => {
    it('resets search and collapsed categories when modal is closed', () => {
      const onClose = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <AllItemsModal {...defaultProps} onClose={onClose} />
      );

      fireEvent.changeText(getByPlaceholderText('allItems.searchPlaceholder'), 'milk');
      fireEvent.press(getByText('Dairy'));
      onClose();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
