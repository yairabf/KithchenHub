import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Vibration } from 'react-native';
import type { GroceryItem } from '../../QuickAddCard';
import { FrequentlyAddedSection } from '../FrequentlyAddedSection';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) => (
      <Text testID={testID ?? `ionicon-${name}`}>{name}</Text>
    ),
  };
});

jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);

jest.mock('../../../../shopping/utils/categoryImage', () => ({
  getCategoryImageSource: jest.fn((category: string) => {
    if (category === 'dairy') {
      return 123;
    }

    if (category === 'bakery') {
      return 456;
    }

    return null;
  }),
  isValidItemImage: jest.fn((value?: string) => typeof value === 'string' && value.trim().length > 0),
}));

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

  it('renders the compact frequent-item layout with centered names and no add badge', () => {
    const { getByTestId, queryByTestId } = render(
      <FrequentlyAddedSection
        isTablet={true}
        isRtl={false}
        items={items}
        onItemPress={jest.fn()}
      />,
    );

    expect(getByTestId('frequent-item-category-image-1')).toBeTruthy();
    expect(getByTestId('frequent-item-category-image-2')).toBeTruthy();
    expect(getByTestId('frequent-item-name-1').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ textAlign: 'center' })]),
    );
    expect(queryByTestId('frequent-item-add-icon-1')).toBeNull();
  });

  it('falls back to the category image when a valid remote image fails to load', () => {
    const itemWithBrokenRemoteImage: GroceryItem = {
      id: '3',
      name: 'Yogurt',
      image: 'https://example.com/broken-yogurt.png',
      category: 'dairy',
      defaultQuantity: 1,
    };

    const { getByTestId, queryByTestId } = render(
      <FrequentlyAddedSection
        isTablet={false}
        isRtl={false}
        items={[itemWithBrokenRemoteImage]}
        onItemPress={jest.fn()}
      />,
    );

    expect(queryByTestId('frequent-item-category-image-3')).toBeNull();

    act(() => {
      getByTestId('frequent-item-image-3').props.onError();
    });

    expect(getByTestId('frequent-item-category-image-3')).toBeTruthy();
  });

  it('calls onItemPress with the tapped item and vibrates for clearer feedback', () => {
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
    expect(Vibration.vibrate).toHaveBeenCalledWith(10);
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
