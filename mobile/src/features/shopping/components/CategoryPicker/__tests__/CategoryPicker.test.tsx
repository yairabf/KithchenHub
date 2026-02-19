import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import { CategoryPicker } from '../CategoryPicker';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: undefined,
}));

describe('CategoryPicker', () => {
  it('preserves non-core categories instead of collapsing to other', () => {
    const { getByTestId, queryByText } = render(
      <CategoryPicker
        selectedCategory="beverages"
        onSelectCategory={jest.fn()}
        categories={['fruits', 'Beverages', 'Baking', 'Condiments']}
      />,
    );

    fireEvent.press(getByTestId('category-picker-trigger'));
    const dropdown = getByTestId('category-picker-dropdown');

    expect(within(dropdown).getByText('fruits')).toBeTruthy();
    expect(within(dropdown).getByText('beverages')).toBeTruthy();
    expect(within(dropdown).getByText('baking')).toBeTruthy();
    expect(within(dropdown).getByText('condiments')).toBeTruthy();
    expect(queryByText('other')).toBeNull();
  });

  it('deduplicates categories using normalized keys', () => {
    const { getAllByText, getByTestId } = render(
      <CategoryPicker
        selectedCategory="beverages"
        onSelectCategory={jest.fn()}
        categories={['Beverages', 'beverages', 'BEVERAGES']}
      />,
    );

    fireEvent.press(getByTestId('category-picker-trigger'));

    expect(getAllByText('beverages')).toHaveLength(2);
  });

  it('emits normalized category ID when selected', () => {
    const onSelectCategory = jest.fn();
    const { getByText, getByTestId } = render(
      <CategoryPicker
        selectedCategory="fruits"
        onSelectCategory={onSelectCategory}
        categories={['Condiments']}
      />,
    );

    fireEvent.press(getByTestId('category-picker-trigger'));
    fireEvent.press(getByText('condiments'));

    expect(onSelectCategory).toHaveBeenCalledWith('condiments');
  });
});
