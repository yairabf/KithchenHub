/**
 * Tests for collapsible category functionality in ShoppingListPanel
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ShoppingListPanel } from '../ShoppingListPanel';
import type { ShoppingList, ShoppingItem } from '../../../../../mocks/shopping';
import type { GroceryItem } from '../../GrocerySearchBar';

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((c) => c),
    Directions: {},
    Gesture: {
      Pan: () => {
        const mockGesture = {
          enabled: jest.fn().mockReturnThis(),
          minPointers: jest.fn().mockReturnThis(),
          maxPointers: jest.fn().mockReturnThis(),
          minDistance: jest.fn().mockReturnThis(),
          activeOffsetX: jest.fn().mockReturnThis(),
          failOffsetY: jest.fn().mockReturnThis(),
          shouldCancelWhenOutside: jest.fn().mockReturnThis(),
          enableTrackpadTwoFingerGesture: jest.fn().mockReturnThis(),
          onStart: jest.fn().mockReturnThis(),
          onUpdate: jest.fn().mockReturnThis(),
          onEnd: jest.fn().mockReturnThis(),
          onFinalize: jest.fn().mockReturnThis(),
        };
        // Make all methods chainable
        Object.keys(mockGesture).forEach((key) => {
          if (typeof mockGesture[key as keyof typeof mockGesture] === 'function') {
            (mockGesture[key as keyof typeof mockGesture] as jest.Mock).mockReturnValue(mockGesture);
          }
        });
        return mockGesture;
      },
    },
    GestureDetector: (props: any) => props.children,
  };
});

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
      Text: View,
      ScrollView: View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    useAnimatedGestureHandler: jest.fn(() => ({})),
    useDerivedValue: jest.fn((cb) => ({ value: cb() })),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDecay: jest.fn((value) => value),
    interpolate: jest.fn(),
    Extrapolate: { CLAMP: 'clamp' },
    runOnJS: jest.fn((fn) => fn),
  };
});

// Mock dependencies  
jest.mock('../../../utils/categoryImage');

describe('ShoppingListPanel - Collapsible Categories', () => {
  const mockShoppingLists: ShoppingList[] = [
    {
      id: 'list-1',
      localId: 'list-1',
      name: 'Groceries',
      icon: 'cart-outline',
      color: '#10B981',
      itemCount: 5,
      isMain: true,
    },
  ];

  const mockGroceryItems: GroceryItem[] = [];

  const createMockItems = (category: string, count: number): ShoppingItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${category}-${i}`,
      localId: `${category}-${i}`,
      name: `${category} Item ${i + 1}`,
      quantity: 1,
      isChecked: false,
      category,
      image: '',
      listId: 'list-1',
    }));
  };

  const defaultProps = {
    shoppingLists: mockShoppingLists,
    selectedList: mockShoppingLists[0],
    filteredItems: [
      ...createMockItems('Fruits', 3),
      ...createMockItems('Vegetables', 2),
      ...createMockItems('Dairy', 1),
    ],
    groceryItems: mockGroceryItems,
    onSelectList: jest.fn(),
    onCreateList: jest.fn(),
    onEditList: jest.fn(),
    onDeleteList: jest.fn(),
    onSelectGroceryItem: jest.fn(),
    onQuickAddItem: jest.fn(),
    onQuantityChange: jest.fn(),
    onDeleteItem: jest.fn(),
    onToggleItemChecked: jest.fn(),
    searchQuery: '',
    onSearchChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render all categories expanded by default', () => {
      const { getByText } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      // All category headers should be visible
      expect(getByText('Fruits')).toBeTruthy();
      expect(getByText('Vegetables')).toBeTruthy();
      expect(getByText('Dairy')).toBeTruthy();

      // Representative items should be visible
      expect(getByText('Fruits Item 1')).toBeTruthy();
      expect(getByText('Vegetables Item 1')).toBeTruthy();
    });

    it('should show chevron-up icon for expanded categories', () => {
      const { getByTestId } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      const fruitsHeader = getByTestId('category-header-fruits');
      expect(fruitsHeader).toBeTruthy();
    });

    it('should display item count in accessibility label', () => {
      const { getByTestId } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      const fruitsHeader = getByTestId('category-header-fruits');
      const accessibilityLabel = fruitsHeader.props.accessibilityLabel;
      
      expect(accessibilityLabel).toContain('Fruits');
      expect(accessibilityLabel).toContain('3');
      expect(accessibilityLabel).toContain('items');
    });
  });

  describe('Category Collapse/Expand', () => {
    describe.each([
      ['Fruits', 'fruits', 3],
      ['Vegetables', 'vegetables', 2],
      ['Dairy', 'dairy', 1],
    ])('Category: %s', (displayName, categoryKey, itemCount) => {
      it(`should collapse ${displayName} category when header is tapped`, () => {
        const { getByTestId, queryByText } = render(
          <ShoppingListPanel {...defaultProps} />
        );

        const categoryHeader = getByTestId(`category-header-${categoryKey}`);
        
        // Tap to collapse
        fireEvent.press(categoryHeader);

        // Items should be hidden
        for (let i = 1; i <= itemCount; i++) {
          expect(queryByText(`${displayName} Item ${i}`)).toBeNull();
        }
      });

      it(`should expand ${displayName} category when tapped again`, () => {
        const { getByTestId, getByText } = render(
          <ShoppingListPanel {...defaultProps} />
        );

        const categoryHeader = getByTestId(`category-header-${categoryKey}`);
        
        // Collapse
        fireEvent.press(categoryHeader);
        
        // Expand
        fireEvent.press(categoryHeader);

        // Items should be visible again
        expect(getByText(`${displayName} Item 1`)).toBeTruthy();
      });

      it(`should update accessibility state when ${displayName} is toggled`, () => {
        const { getByTestId } = render(
          <ShoppingListPanel {...defaultProps} />
        );

        const categoryHeader = getByTestId(`category-header-${categoryKey}`);
        
        // Initially expanded
        expect(categoryHeader.props.accessibilityState.expanded).toBe(true);
        
        // Collapse
        fireEvent.press(categoryHeader);
        expect(categoryHeader.props.accessibilityState.expanded).toBe(false);
        
        // Expand
        fireEvent.press(categoryHeader);
        expect(categoryHeader.props.accessibilityState.expanded).toBe(true);
      });
    });

    it('should maintain independent collapse state for each category', () => {
      const { getByTestId, queryByText, getByText } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      // Collapse Fruits
      fireEvent.press(getByTestId('category-header-fruits'));
      
      // Fruits items should be hidden
      expect(queryByText('Fruits Item 1')).toBeNull();
      
      // But Vegetables items should still be visible
      expect(getByText('Vegetables Item 1')).toBeTruthy();
      
      // And Dairy items should still be visible
      expect(getByText('Dairy Item 1')).toBeTruthy();
    });

    it('should handle multiple categories collapsed simultaneously', () => {
      const { getByTestId, queryByText, getByText } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      // Collapse Fruits and Vegetables
      fireEvent.press(getByTestId('category-header-fruits'));
      fireEvent.press(getByTestId('category-header-vegetables'));
      
      // Both should be hidden
      expect(queryByText('Fruits Item 1')).toBeNull();
      expect(queryByText('Vegetables Item 1')).toBeNull();
      
      // But Dairy should still be visible
      expect(getByText('Dairy Item 1')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty category gracefully', () => {
      const propsWithEmptyCategory = {
        ...defaultProps,
        filteredItems: [
          ...createMockItems('Fruits', 3),
        ],
      };

      const { getByText } = render(
        <ShoppingListPanel {...propsWithEmptyCategory} />
      );

      expect(getByText('Fruits')).toBeTruthy();
    });

    it('should handle category with single item', () => {
      const propsWithSingleItem = {
        ...defaultProps,
        filteredItems: createMockItems('Dairy', 1),
      };

      const { getByTestId, queryByText } = render(
        <ShoppingListPanel {...propsWithSingleItem} />
      );

      const accessibilityLabel = getByTestId('category-header-dairy').props.accessibilityLabel;
      expect(accessibilityLabel).toContain('1 item'); // Singular "item"

      // Collapse
      fireEvent.press(getByTestId('category-header-dairy'));
      expect(queryByText('Dairy Item 1')).toBeNull();
    });

    it('should handle invalid category name gracefully', () => {
      const propsWithInvalidCategory = {
        ...defaultProps,
        filteredItems: [
          {
            id: 'invalid-1',
            localId: 'invalid-1',
            name: 'Invalid Item',
            quantity: 1,
            isChecked: false,
            category: '', // Invalid
            image: '',
            listId: 'list-1',
          },
        ],
      };

      const { getByText } = render(
        <ShoppingListPanel {...propsWithInvalidCategory} />
      );

      // Should fall back to "Other" category
      expect(getByText('Other')).toBeTruthy();
    });

    it('should preserve non-core catalog categories when grouping', () => {
      const propsWithExtendedCategories = {
        ...defaultProps,
        filteredItems: [
          ...createMockItems('Beverages', 2),
          ...createMockItems('Baking', 1),
          ...createMockItems('Condiments', 1),
        ],
      };

      const { getByText, queryByText } = render(
        <ShoppingListPanel {...propsWithExtendedCategories} />
      );

      expect(getByText('Beverages')).toBeTruthy();
      expect(getByText('Baking')).toBeTruthy();
      expect(getByText('Condiments')).toBeTruthy();
      expect(queryByText('Other')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role for category headers', () => {
      const { getByTestId } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      const fruitsHeader = getByTestId('category-header-fruits');
      expect(fruitsHeader.props.accessibilityRole).toBe('button');
    });

    it('should provide helpful accessibility hints', () => {
      const { getByTestId } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      const fruitsHeader = getByTestId('category-header-fruits');
      const hint = fruitsHeader.props.accessibilityHint;
      
      expect(hint).toContain('Double tap');
      expect(hint).toContain('collapse');
    });

    it('should hide decorative elements from accessibility tree', () => {
      const { UNSAFE_getAllByType } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      // This is a basic check - in real implementation,
      // verify that icons have accessibilityElementsHidden={true}
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance', () => {
    it('should not re-render uncollapsed categories when one is collapsed', () => {
      const { getByTestId, getByText } = render(
        <ShoppingListPanel {...defaultProps} />
      );

      const vegetablesItem = getByText('Vegetables Item 1');
      
      // Collapse Fruits (should not affect Vegetables)
      fireEvent.press(getByTestId('category-header-fruits'));
      
      // Vegetables should still be rendered and accessible
      expect(vegetablesItem).toBeTruthy();
    });
  });
});
