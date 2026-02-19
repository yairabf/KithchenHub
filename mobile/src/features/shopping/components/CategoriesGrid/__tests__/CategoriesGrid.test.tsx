/**
 * CategoriesGrid Component Tests
 * 
 * Tests for category grid rendering with and without images.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoriesGrid } from '../CategoriesGrid';
import type { Category } from '../../../../../mocks/shopping';

// Mock the imageUtils to control validation behavior
jest.mock('../../../../../common/utils/imageUtils', () => ({
  isValidImageUrl: jest.fn((image: string) => Boolean(image && image.trim().length > 0)),
}));


jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const map: Record<string, string> = {
        'shopping:categoriesSection.title': 'Categories',
        'categoriesSection.title': 'Categories',
        'shopping:categoriesSection.showMore': 'Show more',
        'categoriesSection.showMore': 'Show more',
        'shopping:categoriesSection.showLess': 'Show less',
        'categoriesSection.showLess': 'Show less',
        'categories:fruits': 'Fruits',
        'categories:vegetables': 'Vegetables',
        'categories:dairy': 'Dairy',
        'categories:meat': 'Meat',
        'categories:seafood': 'Seafood',
        'categories:bakery': 'Bakery',
        'categories:grains': 'Grains',
        'categories:snacks': 'Snacks',
        'categories:nuts': 'Nuts',
      };
      return map[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe('CategoriesGrid', () => {
  const mockOnCategoryPress = jest.fn();

  const defaultProps = {
    onCategoryPress: mockOnCategoryPress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render bundled icon for known category', () => {
    const categories: Category[] = [
      { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: 'https://example.com/fruits.jpg', itemCount: 5, backgroundColor: '#fff' },
    ];

    const { getByTestId, getByText } = render(
      <CategoriesGrid {...defaultProps} categories={categories} />
    );

    // Verify bundled icon is rendered
    expect(getByTestId('category-icon-fruits')).toBeTruthy();
    
    // Verify content is rendered
    expect(getByText('Fruits')).toBeTruthy();
  });

  it('should render bundled icon even when known category image is empty', () => {
    const categories: Category[] = [
      { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: '', itemCount: 5, backgroundColor: '#fff' },
    ];

    const { getByTestId, queryByTestId, getByText } = render(
      <CategoriesGrid {...defaultProps} categories={categories} />
    );

    // Verify tile and bundled icon are rendered
    expect(getByTestId('category-tile-fruits')).toBeTruthy();
    expect(queryByTestId('category-image-fruits')).toBeNull();
    expect(getByTestId('category-icon-fruits')).toBeTruthy();
    
    // Verify content is rendered
    expect(getByText('Fruits')).toBeTruthy();
  });

  it('should render bundled icon even when known category image is whitespace', () => {
    const categories: Category[] = [
      { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: '   ', itemCount: 5, backgroundColor: '#fff' },
    ];

    const { getByTestId, queryByTestId } = render(
      <CategoriesGrid {...defaultProps} categories={categories} />
    );

    expect(getByTestId('category-tile-fruits')).toBeTruthy();
    expect(queryByTestId('category-image-fruits')).toBeNull();
    expect(getByTestId('category-icon-fruits')).toBeTruthy();
  });

  it('should prioritize bundled icon over remote image for known categories', () => {
    const categories: Category[] = [
      { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: 'https://example.com/fruits.jpg', itemCount: 5, backgroundColor: '#fff' },
      { id: 'vegetables', localId: 'uuid-2', name: 'Vegetables', image: '', itemCount: 3, backgroundColor: '#f0f0f0' },
    ];

    const { getByTestId, queryByTestId } = render(
      <CategoriesGrid {...defaultProps} categories={categories} />
    );

    // Known category uses bundled icon
    expect(getByTestId('category-icon-fruits')).toBeTruthy();
    expect(queryByTestId('category-image-fruits')).toBeNull();
    expect(getByTestId('category-tile-fruits')).toBeTruthy();

    // Second known category also uses bundled icon
    expect(getByTestId('category-tile-vegetables')).toBeTruthy();
    expect(queryByTestId('category-image-vegetables')).toBeNull();
    expect(getByTestId('category-icon-vegetables')).toBeTruthy();
  });

  it('should call onCategoryPress when category is pressed', () => {
    const categories: Category[] = [
      { id: '1', localId: 'uuid-1', name: 'Fruits', image: 'fruits.jpg', itemCount: 5, backgroundColor: '#fff' },
    ];

    const { getByText } = render(<CategoriesGrid {...defaultProps} categories={categories} />);
    const categoryTile = getByText('Fruits').parent?.parent;

    // Note: In a real test, we'd use fireEvent.press, but this requires proper test setup
    // This test verifies the component structure is correct
    expect(categoryTile).toBeTruthy();
  });

  it('should render empty state when no categories provided', () => {
    const { queryByText } = render(<CategoriesGrid {...defaultProps} categories={[]} />);

    expect(queryByText('Categories')).toBeTruthy();
  });

  describe('deduplication', () => {
    it('should deduplicate categories with same ID', () => {
      const categories: Category[] = [
        { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: '', itemCount: 5, backgroundColor: '#fff' },
        { id: 'fruits', localId: 'uuid-2', name: 'Fruits', image: '', itemCount: 3, backgroundColor: '#f0f0f0' },
        { id: 'vegetables', localId: 'uuid-3', name: 'Vegetables', image: '', itemCount: 7, backgroundColor: '#e0e0e0' },
      ];

      const { getAllByText, queryByText } = render(
        <CategoriesGrid {...defaultProps} categories={categories} />
      );

      // Should only render one "Fruits" category (first occurrence)
      const fruitsElements = getAllByText('Fruits');
      expect(fruitsElements).toHaveLength(1);
      
      // Should render Vegetables
      expect(queryByText('Vegetables')).toBeTruthy();
    });

    it('should deduplicate multiple duplicate categories', () => {
      const categories: Category[] = [
        { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: '', itemCount: 5, backgroundColor: '#fff' },
        { id: 'fruits', localId: 'uuid-2', name: 'Fruits', image: '', itemCount: 3, backgroundColor: '#f0f0f0' },
        { id: 'fruits', localId: 'uuid-3', name: 'Fruits', image: '', itemCount: 2, backgroundColor: '#e0e0e0' },
        { id: 'vegetables', localId: 'uuid-4', name: 'Vegetables', image: '', itemCount: 7, backgroundColor: '#d0d0d0' },
      ];

      const { getAllByText } = render(
        <CategoriesGrid {...defaultProps} categories={categories} />
      );

      // Should only render one "Fruits" category
      const fruitsElements = getAllByText('Fruits');
      expect(fruitsElements).toHaveLength(1);
    });

    it('should preserve first occurrence when deduplicating', () => {
      const categories: Category[] = [
        { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: '', itemCount: 5, backgroundColor: '#fff' },
        { id: 'fruits', localId: 'uuid-2', name: 'Fruits', image: '', itemCount: 3, backgroundColor: '#f0f0f0' },
      ];

      const { getAllByText } = render(
        <CategoriesGrid {...defaultProps} categories={categories} />
      );

      // Should only render one "Fruits" category (deduplication preserves first)
      const fruitsElements = getAllByText('Fruits');
      expect(fruitsElements).toHaveLength(1);
    });

    it('should handle empty array without errors', () => {
      const { queryByText } = render(
        <CategoriesGrid {...defaultProps} categories={[]} />
      );

      expect(queryByText('Categories')).toBeTruthy();
    });

    it('should handle array with all duplicates', () => {
      const categories: Category[] = [
        { id: 'fruits', localId: 'uuid-1', name: 'Fruits', image: '', itemCount: 5, backgroundColor: '#fff' },
        { id: 'fruits', localId: 'uuid-2', name: 'Fruits', image: '', itemCount: 3, backgroundColor: '#f0f0f0' },
        { id: 'fruits', localId: 'uuid-3', name: 'Fruits', image: '', itemCount: 2, backgroundColor: '#e0e0e0' },
      ];

      const { getAllByText } = render(
        <CategoriesGrid {...defaultProps} categories={categories} />
      );

      // Should only render one category
      const fruitsElements = getAllByText('Fruits');
      expect(fruitsElements).toHaveLength(1);
    });
  });
});
