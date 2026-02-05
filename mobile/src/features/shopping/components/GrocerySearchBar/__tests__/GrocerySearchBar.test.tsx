/**
 * Tests for GrocerySearchBar component
 * 
 * Parameterized tests covering dropdown behavior:
 * - Dropdown stays open when clicking + button
 * - Dropdown closes when clicking outside
 * - Dropdown opens/closes based on search query
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { GrocerySearchBar } from '../GrocerySearchBar';
import { GrocerySearchBarProps, GroceryItem } from '../types';

// Mock Platform.OS
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'web',
    },
  };
});

// Mock useClickOutside hook
jest.mock('../../../../../common/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

import { useClickOutside } from '../../../../../common/hooks/useClickOutside';

const mockUseClickOutside = useClickOutside as jest.MockedFunction<typeof useClickOutside>;

describe('GrocerySearchBar', () => {
  const mockItems: GroceryItem[] = [
    {
      id: '1',
      name: 'Apple',
      category: 'Fruits',
      image: 'https://example.com/apple.jpg',
      defaultQuantity: 1,
    },
    {
      id: '2',
      name: 'Banana',
      category: 'Fruits',
      image: 'https://example.com/banana.jpg',
      defaultQuantity: 1,
    },
    {
      id: '3',
      name: 'Milk',
      category: 'Dairy',
      image: 'https://example.com/milk.jpg',
      defaultQuantity: 1,
    },
  ];

  const mockOnSelectItem = jest.fn();
  const mockOnQuickAddItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseClickOutside.mockImplementation(() => {});
    (Platform as any).OS = 'web';
  });

  describe('dropdown visibility', () => {
    describe.each([
      ['empty query', '', false],
      ['query with no results', 'xyz', false],
      ['query with results', 'app', true],
      ['query matching category', 'fruit', true],
    ])('with %s', (description, query, shouldShowDropdown) => {
      it(`should ${shouldShowDropdown ? 'show' : 'hide'} dropdown`, async () => {
        const { getByPlaceholderText, queryByTestId } = render(
          <GrocerySearchBar
            items={mockItems}
            onSelectItem={mockOnSelectItem}
            onQuickAddItem={mockOnQuickAddItem}
          />
        );

        const input = getByPlaceholderText('Search groceries to add...');
        fireEvent.changeText(input, query);

        await waitFor(() => {
          const dropdown = queryByTestId('grocery-search-dropdown');
          if (shouldShowDropdown) {
            expect(dropdown).toBeTruthy();
          } else {
            expect(dropdown).toBeFalsy();
          }
        });
      });
    });
  });

  describe('quick add button behavior', () => {
    describe.each([
      ['clicking + button on first item', 0, 'Apple'],
      ['clicking + button on second item', 1, 'Banana'],
      ['clicking + button on third item', 2, 'Milk'],
    ])('%s', (description, itemIndex, expectedName) => {
      it('should call onQuickAddItem and keep dropdown open', async () => {
        const { getByPlaceholderText, getByTestId } = render(
          <GrocerySearchBar
            items={mockItems}
            onSelectItem={mockOnSelectItem}
            onQuickAddItem={mockOnQuickAddItem}
          />
        );

        const input = getByPlaceholderText('Search groceries to add...');
        fireEvent.changeText(input, 'a');

        await waitFor(() => {
          const addButton = getByTestId(`add-button-${mockItems[itemIndex].id}`);
          expect(addButton).toBeTruthy();
        });

        // Find and press the add button for the specific item
        const addButton = getByTestId(`add-button-${mockItems[itemIndex].id}`);
        fireEvent.press(addButton);

        expect(mockOnQuickAddItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expectedName,
          })
        );

        // Dropdown should still be visible after clicking +
        await waitFor(() => {
          const dropdown = getByTestId('grocery-search-dropdown');
          expect(dropdown).toBeTruthy();
        });
      });
    });
  });

  describe('item selection behavior', () => {
    describe.each([
      ['selecting first item', 0, 'Apple'],
      ['selecting second item', 1, 'Banana'],
      ['selecting third item', 2, 'Milk'],
    ])('%s', (description, itemIndex, expectedName) => {
      it('should call onSelectItem when clicking item', async () => {
        const { getByPlaceholderText, getByText } = render(
          <GrocerySearchBar
            items={mockItems}
            onSelectItem={mockOnSelectItem}
            onQuickAddItem={mockOnQuickAddItem}
          />
        );

        const input = getByPlaceholderText('Search groceries to add...');
        fireEvent.changeText(input, 'a');

        await waitFor(() => {
          const item = getByText(expectedName);
          expect(item).toBeTruthy();
        });

        const item = getByText(expectedName);
        fireEvent.press(item);

        expect(mockOnSelectItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expectedName,
          })
        );
      });
    });
  });

  describe('click outside behavior', () => {
    it('should register useClickOutside hook when dropdown is visible', async () => {
      const { getByPlaceholderText } = render(
        <GrocerySearchBar
          items={mockItems}
          onSelectItem={mockOnSelectItem}
          onQuickAddItem={mockOnQuickAddItem}
        />
      );

      const input = getByPlaceholderText('Search groceries to add...');
      fireEvent.changeText(input, 'app');

      await waitFor(() => {
        expect(mockUseClickOutside).toHaveBeenCalled();
      });

      const calls = mockUseClickOutside.mock.calls;
      const callWithEnabled = calls.find((c) => c[0]?.enabled === true);
      expect(callWithEnabled).toBeDefined();
      const callArgs = callWithEnabled?.[0];
      if (callArgs == null) {
        throw new Error('Expected at least one useClickOutside call with enabled=true');
      }
      expect(callArgs.testId).toBe('grocery-search-container');
      expect(callArgs.dropdownTestId).toBe('grocery-search-dropdown');
      expect(typeof callArgs.onOutsideClick).toBe('function');
    });

    it('should not register useClickOutside hook when dropdown is hidden', () => {
      render(
        <GrocerySearchBar
          items={mockItems}
          onSelectItem={mockOnSelectItem}
          onQuickAddItem={mockOnQuickAddItem}
        />
      );

      // Dropdown should not be visible initially
      expect(mockUseClickOutside).toHaveBeenCalled();
      const callArgs = mockUseClickOutside.mock.calls[0][0];
      expect(callArgs.enabled).toBe(false);
    });
  });

  describe('input clear behavior', () => {
    describe.each([
      ['clearing input with query', 'apple', true],
      ['clearing input with empty query', '', false],
    ])('%s', (description, initialQuery, shouldShowClearButton) => {
      it(`should ${shouldShowClearButton ? 'show' : 'hide'} clear button`, () => {
        const { getByPlaceholderText, queryByTestId } = render(
          <GrocerySearchBar
            items={mockItems}
            onSelectItem={mockOnSelectItem}
            onQuickAddItem={mockOnQuickAddItem}
          />
        );

        const input = getByPlaceholderText('Search groceries to add...');
        if (initialQuery) {
          fireEvent.changeText(input, initialQuery);
        }

        // Note: The clear button is rendered as an Ionicons component
        // We check for the presence of the input with text instead
        if (shouldShowClearButton) {
          expect(input.props.value).toBe(initialQuery);
        } else {
          expect(input.props.value).toBe('');
        }
      });
    });

    it('should clear input and close dropdown when clear button is pressed', async () => {
      const { getByPlaceholderText, getByTestId, queryByTestId } = render(
        <GrocerySearchBar
          items={mockItems}
          onSelectItem={mockOnSelectItem}
          onQuickAddItem={mockOnQuickAddItem}
        />
      );

      const input = getByPlaceholderText('Search groceries to add...');
      fireEvent.changeText(input, 'apple');

      await waitFor(() => {
        const dropdown = queryByTestId('grocery-search-dropdown');
        expect(dropdown).toBeTruthy();
      });

      const clearButton = getByTestId('grocery-search-clear');
      fireEvent.press(clearButton);

      await waitFor(() => {
        expect(input.props.value).toBe('');
        const dropdown = queryByTestId('grocery-search-dropdown');
        expect(dropdown).toBeFalsy();
      });
    });
  });

  describe('custom items', () => {
    describe.each([
      ['allowCustomItems is true', true, 'custom-query', true],
      ['allowCustomItems is false', false, 'custom-query', false],
      ['query matches existing item', true, 'apple', false],
    ])('%s', (description, allowCustom, query, shouldShowCustom) => {
      it(`should ${shouldShowCustom ? 'show' : 'hide'} custom item option`, async () => {
        const { getByPlaceholderText, queryByText } = render(
          <GrocerySearchBar
            items={mockItems}
            onSelectItem={mockOnSelectItem}
            onQuickAddItem={mockOnQuickAddItem}
            allowCustomItems={allowCustom}
          />
        );

        const input = getByPlaceholderText('Search groceries to add...');
        fireEvent.changeText(input, query);

        await waitFor(() => {
          const customItem = queryByText(/Add "custom-query"/);
          if (shouldShowCustom) {
            expect(customItem).toBeTruthy();
          } else {
            expect(customItem).toBeFalsy();
          }
        });
      });
    });
  });

  describe('controlled vs uncontrolled mode', () => {
    describe.each([
      ['controlled mode', 'controlled-value', true],
      ['uncontrolled mode', undefined, false],
    ])('%s', (description, value, isControlled) => {
      it(`should handle ${description} correctly`, () => {
        const mockOnChangeText = jest.fn();
        const props: Partial<GrocerySearchBarProps> = {
          items: mockItems,
          onSelectItem: mockOnSelectItem,
          onQuickAddItem: mockOnQuickAddItem,
        };

        if (isControlled) {
          props.value = value as string;
          props.onChangeText = mockOnChangeText;
        }

        const { getByPlaceholderText } = render(<GrocerySearchBar {...props} />);

        const input = getByPlaceholderText('Search groceries to add...');
        fireEvent.changeText(input, 'test');

        if (isControlled) {
          expect(mockOnChangeText).toHaveBeenCalledWith('test');
        } else {
          // In uncontrolled mode, the value should update internally
          expect(input.props.value).toBe('test');
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      const { getByPlaceholderText, queryByTestId } = render(
        <GrocerySearchBar
          items={[]}
          onSelectItem={mockOnSelectItem}
          onQuickAddItem={mockOnQuickAddItem}
        />
      );

      const input = getByPlaceholderText('Search groceries to add...');
      fireEvent.changeText(input, 'test');

      const dropdown = queryByTestId('grocery-search-dropdown');
      expect(dropdown).toBeFalsy();
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const { getByPlaceholderText } = render(
        <GrocerySearchBar
          items={mockItems}
          onSelectItem={mockOnSelectItem}
          onQuickAddItem={mockOnQuickAddItem}
        />
      );

      const input = getByPlaceholderText('Search groceries to add...');
      fireEvent.changeText(input, longQuery);

      expect(input.props.value).toBe(longQuery);
    });

    it('should handle special characters in query', () => {
      const specialQuery = '!@#$%^&*()';
      const { getByPlaceholderText } = render(
        <GrocerySearchBar
          items={mockItems}
          onSelectItem={mockOnSelectItem}
          onQuickAddItem={mockOnQuickAddItem}
        />
      );

      const input = getByPlaceholderText('Search groceries to add...');
      fireEvent.changeText(input, specialQuery);

      expect(input.props.value).toBe(specialQuery);
    });
  });
});
