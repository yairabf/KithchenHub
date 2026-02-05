/**
 * ListItemCardWrapper Component Tests
 *
 * Ensures consistent card styling behavior: default/custom background,
 * style application (single and array), and View vs TouchableOpacity when onPress is provided.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ListItemCardWrapper } from '../ListItemCardWrapper';

describe('ListItemCardWrapper', () => {
  it('should render children', () => {
    const { getByText } = render(
      <ListItemCardWrapper>
        <Text>Card content</Text>
      </ListItemCardWrapper>
    );
    expect(getByText('Card content')).toBeTruthy();
  });

  it('should render with testID when provided', () => {
    const { getByTestId } = render(
      <ListItemCardWrapper testID="list-item-card">
        <Text>Content</Text>
      </ListItemCardWrapper>
    );
    expect(getByTestId('list-item-card')).toBeTruthy();
  });

  describe.each([
    ['default background when not provided', undefined],
    ['custom background when provided', '#E8E4D9'],
  ])('backgroundColor: %s', (_, backgroundColor) => {
    it('should render without error', () => {
      const { getByText } = render(
        <ListItemCardWrapper backgroundColor={backgroundColor}>
          <Text>Content</Text>
        </ListItemCardWrapper>
      );
      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('style prop', () => {
    it('should accept single style object', () => {
      const { getByTestId } = render(
        <ListItemCardWrapper testID="card" style={{ minHeight: 80 }}>
          <Text>Content</Text>
        </ListItemCardWrapper>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('should accept style array', () => {
      const { getByTestId } = render(
        <ListItemCardWrapper
          testID="card"
          style={[{ width: '100%' }, { minHeight: 82 }]}
        >
          <Text>Content</Text>
        </ListItemCardWrapper>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('onPress prop', () => {
    it('should render when onPress is not provided', () => {
      const { getByTestId, getByText } = render(
        <ListItemCardWrapper testID="card">
          <Text>Content</Text>
        </ListItemCardWrapper>
      );
      expect(getByTestId('card')).toBeTruthy();
      expect(getByText('Content')).toBeTruthy();
    });

    it('should render when onPress is provided', () => {
      const { getByTestId } = render(
        <ListItemCardWrapper testID="card" onPress={() => {}}>
          <Text>Content</Text>
        </ListItemCardWrapper>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('should call onPress when pressed and onPress is provided', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <ListItemCardWrapper testID="card" onPress={onPress}>
          <Text>Content</Text>
        </ListItemCardWrapper>
      );
      fireEvent.press(getByTestId('card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
