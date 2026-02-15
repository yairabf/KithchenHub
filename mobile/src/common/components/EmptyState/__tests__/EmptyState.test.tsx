/**
 * EmptyState component tests.
 * Covers rendering with/without description and action, and accessibility.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';
import { colors } from '../../../../theme';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('EmptyState', () => {
  describe.each([
    ['title only', { icon: 'cart-outline' as const, title: 'No items' }, ['No items']],
    ['title and description', { icon: 'cart-outline' as const, title: 'No items', description: 'Add something.' }, ['No items', 'Add something.']],
    ['with action', { icon: 'cart-outline' as const, title: 'No items', actionLabel: 'Add first', onActionPress: jest.fn() }, ['No items', 'Add first']],
  ] as const)('renders %s', (_, props, expectedTexts) => {
    it(`shows ${expectedTexts.join(', ')}`, () => {
      const { getByText } = render(<EmptyState {...props} />);
      expectedTexts.forEach((text) => expect(getByText(text)).toBeTruthy());
    });
  });

  it('does not render action button when actionLabel or onActionPress is missing', () => {
    const { queryByText } = render(
      <EmptyState icon="cart-outline" title="Empty" description="Desc" />
    );
    expect(queryByText('Add first item')).toBeNull();
  });

  it('has accessibility role and labels', () => {
    const { getByLabelText } = render(
      <EmptyState
        icon="cart-outline"
        title="No items"
        description="Start adding"
        actionLabel="Add"
        onActionPress={jest.fn()}
      />
    );
    expect(getByLabelText('Empty state: No items')).toBeTruthy();
    expect(getByLabelText('Start adding')).toBeTruthy();
    expect(getByLabelText('Add')).toBeTruthy();
  });
});
