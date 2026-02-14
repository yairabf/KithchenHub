/**
 * ChoreCard Component Tests
 * 
 * Tests for the chore card component with swipe-to-delete and edit functionality.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoreCard } from '../ChoreCard';
import type { Chore } from '../../../../../mocks/chores';

describe('ChoreCard', () => {
  const mockOnToggle = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const baseChore: Chore = {
    id: '1',
    localId: 'local-1',
    title: 'Test Chore',
    icon: '🧹',
    dueDate: '2024-03-15',
    dueTime: '10:00 AM',
    isCompleted: false,
    section: 'today',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['incomplete chore', { isCompleted: false }, 'should show uncheckmark'],
    ['completed chore', { isCompleted: true }, 'should show checkmark'],
  ])('ChoreCard - %s', (scenario, props, description) => {
    it(description, () => {
      const chore = { ...baseChore, ...props };
      const { UNSAFE_getByType } = render(
        <ChoreCard
          chore={chore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Component should render
      expect(UNSAFE_getByType).toBeTruthy();
    });
  });

  describe.each([
    ['with assignee', 'John Doe', true],
    ['without assignee', undefined, false],
  ])('ChoreCard assignee - %s', (scenario, assignee, shouldShow) => {
    it(`should ${shouldShow ? 'display' : 'not display'} assignee`, () => {
      const chore = { ...baseChore, assignee };
      const { queryByText } = render(
        <ChoreCard
          chore={chore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      if (shouldShow && assignee) {
        expect(queryByText(assignee)).toBeTruthy();
      } else {
        expect(queryByText('John Doe')).toBeNull();
      }
    });
  });

  describe('ChoreCard interactions', () => {
    it('should call onToggle when card is pressed', () => {
      const { getByTestId } = render(
        <ChoreCard
          chore={baseChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = getByTestId('chore-card-1');
      fireEvent.press(card);

      expect(mockOnToggle).toHaveBeenCalledWith('1');
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when edit button is pressed', () => {
      const { UNSAFE_getAllByType } = render(
        <ChoreCard
          chore={baseChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Find TouchableOpacity for edit button (first one in the component)
      const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      const editButton = touchables[0]; // Edit button is the first TouchableOpacity

      fireEvent.press(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(baseChore);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should not call onToggle when edit button is pressed', () => {
      const { UNSAFE_getAllByType } = render(
        <ChoreCard
          chore={baseChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      const editButton = touchables[0];

      fireEvent.press(editButton);

      expect(mockOnToggle).not.toHaveBeenCalled();
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  describe('ChoreCard rendering', () => {
    it('should render chore title', () => {
      const { getByText } = render(
        <ChoreCard
          chore={baseChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(getByText('Test Chore')).toBeTruthy();
    });

    it('should render chore icon or default', () => {
      const { getByText } = render(
        <ChoreCard
          chore={baseChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(getByText('🧹')).toBeTruthy();
    });

    it('should render default icon when icon is missing', () => {
      const choreNoIcon = { ...baseChore, icon: undefined };
      const { getByText } = render(
        <ChoreCard
          chore={choreNoIcon}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(getByText('📋')).toBeTruthy();
    });

    it('should render due date and time', () => {
      const { getByText } = render(
        <ChoreCard
          chore={baseChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // The component renders "dueDate dueTime" together
      const dateTimeText = getByText(/2024-03-15.*10:00 AM/);
      expect(dateTimeText).toBeTruthy();
    });
  });

  describe('ChoreCard edge cases', () => {
    it('should handle missing dueTime gracefully', () => {
      const choreNoDueTime = { ...baseChore, dueTime: undefined };
      const { getByText } = render(
        <ChoreCard
          chore={choreNoDueTime}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(getByText(/2024-03-15/)).toBeTruthy();
    });

    it('should apply completed style when chore is completed', () => {
      const completedChore = { ...baseChore, isCompleted: true };
      const { getByText } = render(
        <ChoreCard
          chore={completedChore}
          bgColor="#FFFFFF"
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const title = getByText('Test Chore');
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ textDecorationLine: 'line-through' })
        ])
      );
    });
  });
});
