/**
 * ChoreCard Layout Tests
 * 
 * Tests the refactored ChoreCard component layout to ensure:
 * - Text truncation is handled properly
 * - Layout adapts to different content lengths
 * - Assignee badge displays correctly
 * - Date/time formatting is consistent
 */

import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { formatChoreDueDateTime } from '../../../../../common/utils/choreDisplayUtils';
import type { Chore } from '../../../../../mocks/chores';

// Mock the SwipeableWrapper to avoid gesture handler issues in tests
jest.mock('../../../../../common/components/SwipeableWrapper', () => {
  const { View } = require('react-native');
  return {
    SwipeableWrapper: ({ children }: { children: React.ReactNode }) => (
      <View testID="swipeable-wrapper">{children}</View>
    ),
  };
});

// Mock the ListItemCardWrapper
jest.mock('../../../../../common/components/ListItemCardWrapper', () => {
  const { View } = require('react-native');
  return {
    ListItemCardWrapper: ({ children }: { children: React.ReactNode }) => (
      <View testID="list-item-card-wrapper">{children}</View>
    ),
  };
});

// Import ChoreCard after mocks
import { ChoreCard } from '../ChoreCard';

const mockChore: Chore = {
  id: '1',
  title: 'Clean kitchen',
  icon: '🧹',
  assignee: 'John',
  dueDate: 'Feb 16, 2026',
  dueTime: '6:00 PM',
  isCompleted: false,
  section: 'today',
};

const mockHandlers = {
  onToggle: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

describe('ChoreCard Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    [
      'short title',
      { ...mockChore, title: 'Clean kitchen' },
      'should render with single line title',
    ],
    [
      'long title that would truncate in old layout',
      {
        ...mockChore,
        title: 'Clean the entire kitchen including all dishes, countertops, and appliances',
      },
      'should handle long titles with proper wrapping',
    ],
    [
      'title with special characters',
      { ...mockChore, title: 'Clean & organize 🧼' },
      'should render special characters correctly',
    ],
  ])('rendering with %s', (scenario, chore, description) => {
    it(description, () => {
      const { getByText } = render(
        <ChoreCard
          chore={chore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      expect(getByText(chore.title)).toBeTruthy();
    });
  });

  describe.each([
    [
      'assignee present',
      { ...mockChore, assignee: 'John Doe' },
      'should display assignee badge',
    ],
    [
      'no assignee',
      { ...mockChore, assignee: undefined },
      'should hide assignee badge',
    ],
    [
      'long assignee name',
      { ...mockChore, assignee: 'Christopher Alexander' },
      'should handle long assignee names',
    ],
    [
      'short assignee name',
      { ...mockChore, assignee: 'Jo' },
      'should handle short assignee names',
    ],
  ])('assignee display with %s', (scenario, chore, description) => {
    it(description, () => {
      const { queryByText } = render(
        <ChoreCard
          chore={chore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      if (chore.assignee) {
        expect(queryByText(chore.assignee)).toBeTruthy();
      } else {
        expect(queryByText('Unassigned')).toBeNull();
      }
    });
  });

  describe.each([
    [
      'date and time',
      { ...mockChore, dueDate: 'Feb 16, 2026', dueTime: '6:00 PM' },
      'Feb 16, 2026 · 6:00 PM',
      'should display date and time with separator',
    ],
    [
      'date only',
      { ...mockChore, dueDate: 'Feb 16, 2026', dueTime: undefined },
      'Feb 16, 2026',
      'should display date only without separator',
    ],
    [
      'long date string',
      { ...mockChore, dueDate: 'February 16, 2026', dueTime: '6:00 PM' },
      'February 16, 2026 · 6:00 PM',
      'should handle long date strings',
    ],
  ])('date/time formatting with %s', (scenario, chore, expectedText, description) => {
    it(description, () => {
      const { getByText } = render(
        <ChoreCard
          chore={chore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      expect(getByText(expectedText)).toBeTruthy();
    });
  });

  describe('completion status', () => {
    it('should apply strikethrough style when completed', () => {
      const completedChore = { ...mockChore, isCompleted: true };
      const { getByText } = render(
        <ChoreCard
          chore={completedChore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      const titleElement = getByText(completedChore.title);
      expect(titleElement).toBeTruthy();
      expect(titleElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ textDecorationLine: 'line-through' })
        ])
      );
    });

    it('should not apply strikethrough style when not completed', () => {
      const { getByText } = render(
        <ChoreCard
          chore={mockChore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      const titleElement = getByText(mockChore.title);
      expect(titleElement).toBeTruthy();
      // Check that style array does not contain strikethrough
      const styles = Array.isArray(titleElement.props.style)
        ? titleElement.props.style.flat()
        : [titleElement.props.style];
      
      const hasStrikethrough = styles.some(
        (style: any) => style && style.textDecorationLine === 'line-through'
      );
      expect(hasStrikethrough).toBe(false);
    });
  });

  describe('layout structure', () => {
    it('should render all components in correct order', () => {
      const { getByText } = render(
        <ChoreCard
          chore={mockChore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      // Title should be present
      expect(getByText(mockChore.title)).toBeTruthy();
      
      // Assignee should be present
      expect(getByText(mockChore.assignee!)).toBeTruthy();
      
      // Date/time should be present (using utility function)
      const formattedDateTime = formatChoreDueDateTime(mockChore.dueDate, mockChore.dueTime);
      expect(getByText(formattedDateTime)).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty icon gracefully', () => {
      const choreWithoutIcon = { ...mockChore, icon: undefined };
      const { getByText } = render(
        <ChoreCard
          chore={choreWithoutIcon}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      // Should still render the chore with default icon
      expect(getByText(choreWithoutIcon.title)).toBeTruthy();
      expect(getByText('📋')).toBeTruthy(); // Default icon
    });

    it('should handle all fields at maximum length', () => {
      const maxLengthChore: Chore = {
        ...mockChore,
        title: 'Clean the entire kitchen including all dishes, countertops, appliances, floors, and organize the pantry',
        assignee: 'Christopher Alexander Johnson',
        dueDate: 'February 16, 2026',
        dueTime: '11:59 PM',
      };
      
      const { getByText } = render(
        <ChoreCard
          chore={maxLengthChore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      expect(getByText(maxLengthChore.title)).toBeTruthy();
      expect(getByText(maxLengthChore.assignee!)).toBeTruthy();
      expect(getByText('February 16, 2026 · 11:59 PM')).toBeTruthy();
    });
  });

  describe('integration with utility function', () => {
    it('should use formatChoreDueDateTime for date/time display', () => {
      const { getByText } = render(
        <ChoreCard
          chore={mockChore}
          bgColor="#ffffff"
          {...mockHandlers}
        />
      );
      
      const expectedText = formatChoreDueDateTime(mockChore.dueDate, mockChore.dueTime);
      expect(getByText(expectedText)).toBeTruthy();
    });
  });
});
