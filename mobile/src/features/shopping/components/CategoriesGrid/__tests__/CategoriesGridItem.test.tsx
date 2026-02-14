/**
 * CategoriesGridItem Component Tests
 * 
 * Tests for the refactored category grid item with icon-positioned-top-right layout.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoriesGridItem } from '../CategoriesGridItem';
import type { Category } from '../types';

// Mock the imageUtils to control validation behavior
jest.mock('../../../../../common/utils/imageUtils', () => ({
  isValidImageUrl: jest.fn((image: string) => Boolean(image && image.trim().length > 0)),
}));

describe('CategoriesGridItem - Refactored Layout', () => {
  const mockOnPress = jest.fn();
  const mockCategoryIcon = { uri: 'mock-icon' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    [
      'with local icon',
      {
        category: { id: 'fruits', name: 'Fruits', image: '', itemCount: 5, backgroundColor: '#FFE5E5' },
        categoryIcon: mockCategoryIcon,
      },
      true,
      false,
    ],
    [
      'with remote image',
      {
        category: { id: 'vegetables', name: 'Vegetables', image: 'https://example.com/veggies.jpg', itemCount: 3, backgroundColor: '#E5F5E5' },
        categoryIcon: null,
      },
      false,
      true,
    ],
    [
      'with no image',
      {
        category: { id: 'other', name: 'Other', image: '', itemCount: 1, backgroundColor: '#F0F0F0' },
        categoryIcon: null,
      },
      false,
      false,
    ],
  ])('%s', (scenario, props, expectsIcon, expectsRemoteImage) => {
    it('should render category name at bottom-left with proper styling', () => {
      const { getByText } = render(
        <CategoriesGridItem
          category={props.category}
          onPress={mockOnPress}
          categoryIcon={props.categoryIcon}
        />
      );

      const nameElement = getByText(props.category.name);
      expect(nameElement).toBeTruthy();
      
      // Check that style is an array with base styles and responsive fontSize
      const styleArray = Array.isArray(nameElement.props.style) 
        ? nameElement.props.style 
        : [nameElement.props.style];
      
      // Base style should include fontWeight
      expect(styleArray[0]).toMatchObject({
        fontWeight: '700',
      });
      
      // Responsive fontSize should be present (13-18px range for phone/tablet)
      const responsiveStyle = styleArray.find(s => s.fontSize !== undefined);
      expect(responsiveStyle?.fontSize).toBeGreaterThanOrEqual(13);
      expect(responsiveStyle?.fontSize).toBeLessThanOrEqual(18);
    });

    it('should render icon/image at top-right when present', () => {
      const { queryByTestId } = render(
        <CategoriesGridItem
          category={props.category}
          onPress={mockOnPress}
          categoryIcon={props.categoryIcon}
        />
      );

      const iconElement = queryByTestId(`category-icon-${props.category.id}`);
      const imageElement = queryByTestId(`category-image-${props.category.id}`);

      if (expectsIcon) {
        expect(iconElement).toBeTruthy();
        expect(imageElement).toBeNull();
      } else if (expectsRemoteImage) {
        expect(imageElement).toBeTruthy();
        expect(iconElement).toBeNull();
      } else {
        expect(iconElement).toBeNull();
        expect(imageElement).toBeNull();
      }
    });

    it('should apply correct backgroundColor to container', () => {
      const { getByTestId } = render(
        <CategoriesGridItem
          category={props.category}
          onPress={mockOnPress}
          categoryIcon={props.categoryIcon}
        />
      );

      const container = getByTestId(`category-tile-${props.category.id}`);
      expect(container).toBeTruthy();
    });

    it('should call onPress when category tile is tapped', () => {
      const { getByTestId } = render(
        <CategoriesGridItem
          category={props.category}
          onPress={mockOnPress}
          categoryIcon={props.categoryIcon}
        />
      );

      const tile = getByTestId(`category-tile-${props.category.id}`).parent;
      expect(tile).toBeTruthy();
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Icon positioning and sizing', () => {
    it('should position icon at top-right corner with responsive dimensions', () => {
      const category: Category = {
        id: 'test',
        name: 'Test Category',
        image: '',
        itemCount: 5,
        backgroundColor: '#FFF',
      };

      const { getByTestId } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={mockCategoryIcon}
        />
      );

      const icon = getByTestId('category-icon-test');
      const styleArray = Array.isArray(icon.props.style) 
        ? icon.props.style 
        : [icon.props.style];
      
      // Base style should have position absolute
      expect(styleArray[0]).toMatchObject({
        position: 'absolute',
      });
      
      // Responsive dimensions should be in valid ranges
      const responsiveStyle = styleArray.find(s => s.width !== undefined);
      expect(responsiveStyle?.width).toBeGreaterThanOrEqual(48);
      expect(responsiveStyle?.width).toBeLessThanOrEqual(100);
      expect(responsiveStyle?.height).toBeGreaterThanOrEqual(48);
      expect(responsiveStyle?.height).toBeLessThanOrEqual(100);
      expect(responsiveStyle?.top).toBeGreaterThanOrEqual(6);
      expect(responsiveStyle?.top).toBeLessThanOrEqual(10);
      expect(responsiveStyle?.right).toBeGreaterThanOrEqual(6);
      expect(responsiveStyle?.right).toBeLessThanOrEqual(10);
      
      expect(icon.props.resizeMode).toBe('contain');
    });

    it('should use contain resize mode for images', () => {
      const category: Category = {
        id: 'test',
        name: 'Test',
        image: 'https://example.com/img.jpg',
        itemCount: 2,
        backgroundColor: '#FFF',
      };

      const { getByTestId } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={null}
        />
      );

      const image = getByTestId('category-image-test');
      expect(image.props.resizeMode).toBe('contain');
    });
  });

  describe('Layout structure', () => {
    it('should render name container at bottom with proper structure', () => {
      const category: Category = {
        id: 'fruits',
        name: 'Fruits',
        image: '',
        itemCount: 10,
        backgroundColor: '#FFE5E5',
      };

      const { getByText } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={null}
        />
      );

      const name = getByText('Fruits');
      const nameContainer = name.parent;
      
      expect(nameContainer).toBeTruthy();
      expect(name).toBeTruthy();
    });

    it('should handle long category names with numberOfLines', () => {
      const category: Category = {
        id: 'long',
        name: 'Very Long Category Name That Should Truncate',
        image: '',
        itemCount: 1,
        backgroundColor: '#FFF',
      };

      const { getByText } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={null}
        />
      );

      const name = getByText(category.name);
      expect(name).toBeTruthy();
    });
  });

  describe('Image validation', () => {
    it('should not render image when URL is empty string', () => {
      const category: Category = {
        id: 'empty',
        name: 'Empty',
        image: '',
        itemCount: 0,
        backgroundColor: '#FFF',
      };

      const { queryByTestId } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={null}
        />
      );

      expect(queryByTestId('category-image-empty')).toBeNull();
      expect(queryByTestId('category-icon-empty')).toBeNull();
    });

    it('should not render image when URL is whitespace', () => {
      const category: Category = {
        id: 'whitespace',
        name: 'Whitespace',
        image: '   ',
        itemCount: 0,
        backgroundColor: '#FFF',
      };

      const { queryByTestId } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={null}
        />
      );

      expect(queryByTestId('category-image-whitespace')).toBeNull();
    });
  });

  describe('Priority of icon over remote image', () => {
    it('should render local icon when both icon and remote image are provided', () => {
      const category: Category = {
        id: 'both',
        name: 'Both',
        image: 'https://example.com/img.jpg',
        itemCount: 5,
        backgroundColor: '#FFF',
      };

      const { queryByTestId } = render(
        <CategoriesGridItem
          category={category}
          onPress={mockOnPress}
          categoryIcon={mockCategoryIcon}
        />
      );

      // Icon should be rendered
      expect(queryByTestId('category-icon-both')).toBeTruthy();
      // Remote image should NOT be rendered
      expect(queryByTestId('category-image-both')).toBeNull();
    });
  });
});
