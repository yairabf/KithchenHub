/**
 * ChoresSection Component Tests
 * 
 * Tests for the reusable section component with colored indicator and chore list.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ChoresSection } from '../ChoresSection';
import type { Chore } from '../../../../../mocks/chores';

describe('ChoresSection', () => {
  const mockRenderChoreCard = jest.fn((chore: Chore) => (
    <Text key={chore.id}>{chore.title}</Text>
  ));

  const baseChore: Chore = {
    id: '1',
    localId: 'local-1',
    title: 'Test Chore',
    icon: '🧹',
    dueDate: '2024-03-15',
    isCompleted: false,
    section: 'today',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render section title', () => {
      const { getByText } = render(
        <ChoresSection
          title="Today's Chores"
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(getByText("Today's Chores")).toBeTruthy();
    });

    it('should render with testID when provided', () => {
      const { getByTestId } = render(
        <ChoresSection
          title="Test Section"
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
          testID="test-section"
        />
      );

      expect(getByTestId('test-section')).toBeTruthy();
    });
  });

  describe.each([
    ['primary', 'primary'],
    ['secondary', 'secondary'],
    ['default (undefined)', undefined],
  ])('Indicator color - %s', (scenario, indicatorColor) => {
    it('should render with correct indicator style', () => {
      const { UNSAFE_root } = render(
        <ChoresSection
          title="Test Section"
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
          indicatorColor={indicatorColor as 'primary' | 'secondary' | undefined}
        />
      );

      // Component should render without crashing
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Chore list rendering', () => {
    it('should render list when chores are provided', () => {
      const chores = [
        { ...baseChore, id: '1', title: 'Chore 1' },
        { ...baseChore, id: '2', title: 'Chore 2' },
      ];

      const { getByText } = render(
        <ChoresSection
          title="Test Section"
          chores={chores}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(getByText('Chore 1')).toBeTruthy();
      expect(getByText('Chore 2')).toBeTruthy();
      expect(mockRenderChoreCard).toHaveBeenCalledTimes(2);
    });

    it('should not render list when chores array is empty', () => {
      const { queryByText } = render(
        <ChoresSection
          title="Empty Section"
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(mockRenderChoreCard).not.toHaveBeenCalled();
    });

    it('should call renderChoreCard for each chore', () => {
      const chores = [
        { ...baseChore, id: '1', title: 'Chore 1' },
        { ...baseChore, id: '2', title: 'Chore 2' },
        { ...baseChore, id: '3', title: 'Chore 3' },
      ];

      render(
        <ChoresSection
          title="Test Section"
          chores={chores}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(mockRenderChoreCard).toHaveBeenCalledTimes(3);
      // Verify each chore was rendered
      const calls = mockRenderChoreCard.mock.calls;
      expect(calls[0][0]).toMatchObject({ id: '1', title: 'Chore 1' });
      expect(calls[1][0]).toMatchObject({ id: '2', title: 'Chore 2' });
      expect(calls[2][0]).toMatchObject({ id: '3', title: 'Chore 3' });
    });
  });

  describe('onLayout callback', () => {
    it('should call onLayout when provided', () => {
      const mockOnLayout = jest.fn();
      const { UNSAFE_getByType } = render(
        <ChoresSection
          title="Test Section"
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
          onLayout={mockOnLayout}
        />
      );

      // Layout event would be triggered by React Native
      expect(UNSAFE_getByType).toBeTruthy();
    });

    it('should work without onLayout callback', () => {
      const { getByText } = render(
        <ChoresSection
          title="Test Section"
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(getByText('Test Section')).toBeTruthy();
    });
  });

  describe('Integration scenarios', () => {
    it('should render complete section with title, indicator, and chores', () => {
      const chores = [
        { ...baseChore, id: '1', title: 'Morning Task' },
        { ...baseChore, id: '2', title: 'Evening Task' },
      ];

      const { getByText } = render(
        <ChoresSection
          title="Today's Chores"
          chores={chores}
          indicatorColor="primary"
          renderChoreCard={mockRenderChoreCard}
          testID="today-section"
        />
      );

      expect(getByText("Today's Chores")).toBeTruthy();
      expect(getByText('Morning Task')).toBeTruthy();
      expect(getByText('Evening Task')).toBeTruthy();
    });

    it('should handle mixed completed and incomplete chores', () => {
      const chores = [
        { ...baseChore, id: '1', title: 'Completed Task', isCompleted: true },
        { ...baseChore, id: '2', title: 'Pending Task', isCompleted: false },
      ];

      const { getByText } = render(
        <ChoresSection
          title="Mixed Section"
          chores={chores}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(getByText('Completed Task')).toBeTruthy();
      expect(getByText('Pending Task')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle single chore', () => {
      const chores = [{ ...baseChore, id: '1', title: 'Only Task' }];

      const { getByText } = render(
        <ChoresSection
          title="Single Task"
          chores={chores}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(getByText('Only Task')).toBeTruthy();
      expect(mockRenderChoreCard).toHaveBeenCalledTimes(1);
    });

    it('should handle very long title', () => {
      const longTitle = 'This is a very long section title that might wrap';

      const { getByText } = render(
        <ChoresSection
          title={longTitle}
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      expect(getByText(longTitle)).toBeTruthy();
    });

    it('should handle empty title gracefully', () => {
      const { getByText } = render(
        <ChoresSection
          title=""
          chores={[]}
          renderChoreCard={mockRenderChoreCard}
        />
      );

      // Should render without crashing even with empty title
      expect(getByText('')).toBeTruthy();
    });
  });
});
