import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CategoryPicker } from '../CategoryPicker';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

describe('CategoryPicker', () => {
  it('preserves non-core categories instead of collapsing to other', () => {
    const { getByText, queryByText } = render(
      <CategoryPicker
        selectedCategory="beverages"
        onSelectCategory={jest.fn()}
        categories={['fruits', 'Beverages', 'Baking', 'Condiments']}
      />,
    );

    expect(getByText('fruits')).toBeTruthy();
    expect(getByText('beverages')).toBeTruthy();
    expect(getByText('baking')).toBeTruthy();
    expect(getByText('condiments')).toBeTruthy();
    expect(queryByText('other')).toBeNull();
  });

  it('deduplicates categories using normalized keys', () => {
    const { getAllByText } = render(
      <CategoryPicker
        selectedCategory="beverages"
        onSelectCategory={jest.fn()}
        categories={['Beverages', 'beverages', 'BEVERAGES']}
      />,
    );

    expect(getAllByText('beverages')).toHaveLength(1);
  });

  it('emits normalized category ID when selected', () => {
    const onSelectCategory = jest.fn();
    const { getByText } = render(
      <CategoryPicker
        selectedCategory="fruits"
        onSelectCategory={onSelectCategory}
        categories={['Condiments']}
      />,
    );

    fireEvent.press(getByText('condiments'));
    expect(onSelectCategory).toHaveBeenCalledWith('condiments');
  });
});
