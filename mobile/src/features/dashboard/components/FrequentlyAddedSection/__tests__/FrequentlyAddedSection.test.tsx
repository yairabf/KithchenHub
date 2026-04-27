import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { GroceryItem } from '../../QuickAddCard';
import { FrequentlyAddedSection } from '../FrequentlyAddedSection';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) => {
      const translations: Record<string, string> = {
        'frequentlyAdded.title': 'Frequently Added',
        'frequentlyAdded.subtitle': 'Repeat items for your next list',
        'frequentlyAdded.emptyTitle': 'Your frequently added items will show up here',
        'frequentlyAdded.emptySubtitle': 'Once the backend is ready, this area will surface the items you add the most.',
        'frequentlyAdded.addItemAccessibility': options?.name
          ? `Add ${options.name} to list`
          : 'Add item to list',
      };
      return translations[key] || key;
    },
  }),
}));

const items: GroceryItem[] = [
  {
    id: '1',
    name: 'Milk',
    image: '',
    category: 'dairy',
    defaultQuantity: 1,
  },
  {
    id: '2',
    name: 'Bread',
    image: '',
    category: 'bakery',
    defaultQuantity: 1,
  },
];

describe('FrequentlyAddedSection', () => {
  it('renders a dedicated frequent-items section when items are available', () => {
    const { getByText } = render(
      <FrequentlyAddedSection
        isTablet={true}
        isRtl={false}
        items={items}
        onItemPress={jest.fn()}
      />,
    );

    expect(getByText('Frequently Added')).toBeTruthy();
    expect(getByText('Repeat items for your next list')).toBeTruthy();
    expect(getByText('Milk')).toBeTruthy();
    expect(getByText('Bread')).toBeTruthy();
  });

  it('calls onItemPress with the tapped item', () => {
    const onItemPress = jest.fn();
    const { getByLabelText } = render(
      <FrequentlyAddedSection
        isTablet={false}
        isRtl={false}
        items={items}
        onItemPress={onItemPress}
      />,
    );

    fireEvent.press(getByLabelText('Add Milk to list'));
    expect(onItemPress).toHaveBeenCalledWith(items[0]);
  });

  it('renders an in-UI placeholder when there are no frequent items yet', () => {
    const { getByText, queryByText } = render(
      <FrequentlyAddedSection
        isTablet={true}
        isRtl={false}
        items={[]}
        onItemPress={jest.fn()}
      />,
    );

    expect(getByText('Frequently Added')).toBeTruthy();
    expect(getByText('Your frequently added items will show up here')).toBeTruthy();
    expect(
      getByText('Once the backend is ready, this area will surface the items you add the most.'),
    ).toBeTruthy();
    expect(queryByText('Milk')).toBeNull();
  });
});
