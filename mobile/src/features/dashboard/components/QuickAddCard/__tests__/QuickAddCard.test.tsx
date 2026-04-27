import React from 'react';
import { render } from '@testing-library/react-native';
import type { GroceryItem } from '../types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'quickAdd.title': 'Quick Add',
        'quickAdd.subtitle': 'Add groceries in seconds',
        'quickAdd.mainListBadge': 'Main List',
        'quickAdd.voiceInput': 'Voice input',
        'quickAdd.voiceInputHint': 'Use voice to add items',
        'search.placeholder': 'Search groceries',
      };
      return translations[key] || key;
    },
  }),
}));

import { QuickAddCard } from '../QuickAddCard';

const mockGroceryItem: GroceryItem = {
  id: '1',
  name: 'Milk',
  image: '',
  category: 'dairy',
  defaultQuantity: 1,
};

const defaultProps = {
  isTablet: true,
  isRtl: false,
  searchValue: '',
  onSearchChange: jest.fn(),
  searchResults: [],
  onSelectItem: jest.fn(),
  onQuickAddItem: jest.fn(),
};

describe('QuickAddCard', () => {
  describe('core layout', () => {
    it('renders quick add content without the legacy suggested-items section', () => {
      const { getByText, queryByText } = render(
        <QuickAddCard {...defaultProps} />,
      );

      expect(getByText('Quick Add')).toBeTruthy();
      expect(getByText('Add groceries in seconds')).toBeTruthy();
      expect(getByText('Main List')).toBeTruthy();
      expect(queryByText('Suggested Items')).toBeNull();
      expect(queryByText('Milk')).toBeNull();
    });
  });

  describe('RTL behavior', () => {
    it('renders correctly in RTL mode', () => {
      const { getByText, toJSON } = render(
        <QuickAddCard {...defaultProps} isRtl={true} />,
      );

      expect(getByText('Quick Add')).toBeTruthy();
      expect(getByText('Add groceries in seconds')).toBeTruthy();
      expect(getByText('Main List')).toBeTruthy();
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('mobile layout', () => {
    it('renders without crashing when isTablet is false', () => {
      const { toJSON } = render(
        <QuickAddCard {...defaultProps} isTablet={false} />,
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('RTL fallback', () => {
    it('renders when isRtl is omitted', () => {
      const { getByText } = render(
        <QuickAddCard {...defaultProps} isRtl={undefined} />,
      );

      expect(getByText('Quick Add')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('provides proper accessibility labels for voice input', () => {
      const { UNSAFE_getByProps } = render(<QuickAddCard {...defaultProps} />);

      const micButton = UNSAFE_getByProps({ accessibilityLabel: 'Voice input' });
      expect(micButton).toBeTruthy();
      expect(micButton.props.accessibilityRole).toBe('button');
      expect(micButton.props.accessibilityHint).toBe('Use voice to add items');
    });
  });

  describe('search integration', () => {
    it('accepts search results without rendering legacy suggestion chips', () => {
      const { queryByText } = render(
        <QuickAddCard {...defaultProps} searchResults={[mockGroceryItem]} />,
      );

      expect(queryByText('Milk')).toBeNull();
    });
  });
});
