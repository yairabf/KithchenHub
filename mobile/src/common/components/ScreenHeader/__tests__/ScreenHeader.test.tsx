/**
 * ScreenHeader Component Tests
 * 
 * Tests for the unified header component with support for custom children content.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { ScreenHeader } from '../ScreenHeader';

describe('ScreenHeader', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render title only', () => {
      const { getByText } = render(<ScreenHeader title="Test Title" />);
      
      expect(getByText('Test Title')).toBeTruthy();
    });

    it('should render title and subtitle', () => {
      const { getByText } = render(
        <ScreenHeader title="Test Title" subtitle="Test Subtitle" />
      );
      
      expect(getByText('Test Title')).toBeTruthy();
      expect(getByText('Test Subtitle')).toBeTruthy();
    });

    it('should render title icon when provided', () => {
      const { getByText } = render(
        <ScreenHeader title="Shopping List" titleIcon="basket-outline" />
      );

      expect(getByText('Shopping List')).toBeTruthy();
    });

    it('should not render subtitle when not provided', () => {
      const { queryByText } = render(<ScreenHeader title="Test Title" />);
      
      // Should only have title, no subtitle
      expect(queryByText('Test Subtitle')).toBeNull();
    });
  });

  describe('Children rendering', () => {
    it('should render children below title and subtitle', () => {
      const { getByText, getByTestId } = render(
        <ScreenHeader 
          title="Test Title" 
          subtitle="Test Subtitle"
        >
          <View testID="custom-content">
            <Text>Custom Content</Text>
          </View>
        </ScreenHeader>
      );
      
      expect(getByText('Test Title')).toBeTruthy();
      expect(getByText('Test Subtitle')).toBeTruthy();
      expect(getByTestId('custom-content')).toBeTruthy();
      expect(getByText('Custom Content')).toBeTruthy();
    });

    it('should render children without subtitle', () => {
      const { getByText, getByTestId, queryByText } = render(
        <ScreenHeader title="Test Title">
          <View testID="custom-content">
            <Text>Custom Content</Text>
          </View>
        </ScreenHeader>
      );
      
      expect(getByText('Test Title')).toBeTruthy();
      expect(queryByText('Test Subtitle')).toBeNull();
      expect(getByTestId('custom-content')).toBeTruthy();
      expect(getByText('Custom Content')).toBeTruthy();
    });

    it('should render complex children (stats example)', () => {
      const { getByText } = render(
        <ScreenHeader title="House Recipes" subtitle="KITCHEN COLLECTIONS">
          <View>
            <Text>5 Recipes</Text>
            <Text>25m Avg</Text>
          </View>
        </ScreenHeader>
      );
      
      expect(getByText('House Recipes')).toBeTruthy();
      expect(getByText('KITCHEN COLLECTIONS')).toBeTruthy();
      expect(getByText('5 Recipes')).toBeTruthy();
      expect(getByText('25m Avg')).toBeTruthy();
    });

    it('should not render children when undefined', () => {
      const { getByText, queryByTestId } = render(
        <ScreenHeader title="Test Title" subtitle="Test Subtitle" />
      );
      
      expect(getByText('Test Title')).toBeTruthy();
      expect(getByText('Test Subtitle')).toBeTruthy();
      // No children should be present
    });
  });

  describe('Centered variant', () => {
    it('should render centered title', () => {
      const { getByText } = render(
        <ScreenHeader title="Centered Title" variant="centered" />
      );
      
      expect(getByText('Centered Title')).toBeTruthy();
    });

    it('should not render subtitle in centered variant', () => {
      const { getByText, queryByText } = render(
        <ScreenHeader 
          title="Centered Title" 
          subtitle="Should Not Show"
          variant="centered" 
        />
      );
      
      expect(getByText('Centered Title')).toBeTruthy();
      expect(queryByText('Should Not Show')).toBeNull();
    });

    it('should not render children in centered variant', () => {
      const { getByText, queryByTestId } = render(
        <ScreenHeader title="Centered Title" variant="centered">
          <View testID="custom-content">
            <Text>Should Not Render</Text>
          </View>
        </ScreenHeader>
      );
      
      expect(getByText('Centered Title')).toBeTruthy();
      expect(queryByTestId('custom-content')).toBeNull();
    });
  });

  describe('Right actions', () => {
    it('should render add action button', () => {
      const { getByLabelText } = render(
        <ScreenHeader
          title="Test"
          rightActions={{
            add: { onPress: mockOnPress, label: 'Add item' },
          }}
        />
      );
      
      expect(getByLabelText('Add item')).toBeTruthy();
    });

    it('should render multiple action buttons', () => {
      const { getByLabelText } = render(
        <ScreenHeader
          title="Test"
          rightActions={{
            edit: { onPress: mockOnPress, label: 'Edit' },
            share: { onPress: mockOnPress, label: 'Share' },
            add: { onPress: mockOnPress, label: 'Add' },
          }}
        />
      );
      
      expect(getByLabelText('Edit')).toBeTruthy();
      expect(getByLabelText('Share')).toBeTruthy();
      expect(getByLabelText('Add')).toBeTruthy();
    });

    it('should render actions with children', () => {
      const { getByText, getByLabelText } = render(
        <ScreenHeader
          title="Test"
          rightActions={{
            add: { onPress: mockOnPress, label: 'Add item' },
          }}
        >
          <Text>Custom Stats</Text>
        </ScreenHeader>
      );
      
      expect(getByText('Test')).toBeTruthy();
      expect(getByText('Custom Stats')).toBeTruthy();
      expect(getByLabelText('Add item')).toBeTruthy();
    });

    it('should render custom right slot content', () => {
      const { getByText } = render(
        <ScreenHeader
          title="Dashboard"
          rightSlot={<Text>09:45</Text>}
        />
      );

      expect(getByText('Dashboard')).toBeTruthy();
      expect(getByText('09:45')).toBeTruthy();
    });
  });

  describe('Left icon', () => {
    it('should render back icon when specified', () => {
      const { getByLabelText } = render(
        <ScreenHeader
          title="Test"
          leftIcon="back"
          onLeftPress={mockOnPress}
        />
      );
      
      expect(getByLabelText('accessibility.goBack')).toBeTruthy();
    });

    it('should render home icon when specified', () => {
      const { getByLabelText } = render(
        <ScreenHeader
          title="Test"
          leftIcon="home"
          onLeftPress={mockOnPress}
        />
      );
      
      expect(getByLabelText('accessibility.goToHome')).toBeTruthy();
    });

    it('should not render icon when leftIcon is none', () => {
      const { queryByLabelText } = render(
        <ScreenHeader
          title="Test"
          leftIcon="none"
          onLeftPress={mockOnPress}
        />
      );
      
      expect(queryByLabelText('accessibility.goBack')).toBeNull();
      expect(queryByLabelText('accessibility.goToHome')).toBeNull();
    });

    it('should not render icon when onLeftPress is not provided', () => {
      const { queryByLabelText } = render(
        <ScreenHeader title="Test" leftIcon="back" />
      );
      
      expect(queryByLabelText('accessibility.goBack')).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should render complete header with all features', () => {
      const { getByText, getByLabelText, getByTestId } = render(
        <ScreenHeader
          title="House Recipes"
          subtitle="KITCHEN COLLECTIONS"
          leftIcon="back"
          onLeftPress={mockOnPress}
          rightActions={{
            add: { onPress: mockOnPress, label: 'Add recipe' },
          }}
        >
          <View testID="recipe-stats">
            <Text>5 Recipes</Text>
            <Text>25m Avg</Text>
          </View>
        </ScreenHeader>
      );
      
      // All elements should be present
      expect(getByText('House Recipes')).toBeTruthy();
      expect(getByText('KITCHEN COLLECTIONS')).toBeTruthy();
      expect(getByLabelText('accessibility.goBack')).toBeTruthy();
      expect(getByLabelText('Add recipe')).toBeTruthy();
      expect(getByTestId('recipe-stats')).toBeTruthy();
      expect(getByText('5 Recipes')).toBeTruthy();
      expect(getByText('25m Avg')).toBeTruthy();
    });
  });
});
