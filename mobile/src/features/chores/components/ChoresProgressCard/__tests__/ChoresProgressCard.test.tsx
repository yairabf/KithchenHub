/**
 * ChoresProgressCard Component Tests
 * 
 * Tests for the progress card component with responsive layout and edge case handling.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ChoresProgressCard } from '../ChoresProgressCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      if (key === 'progress.today') return 'Today';
      if (key === 'progress.title') return 'Daily Progress';
      if (key === 'progress.bodyCompact') {
        return `You've completed ${options?.completed ?? 0} out of ${options?.total ?? 0} chores today. Keep it up!`;
      }
      if (key === 'progress.bodyWide') {
        return `You've completed ${options?.completed ?? 0} out of ${options?.total ?? 0} chores today. Keep it up to reach your weekly goals!`;
      }
      return key;
    },
    i18n: {
      dir: () => 'ltr',
    },
  }),
}));

describe('ChoresProgressCard', () => {
  describe.each([
    ['0% progress', 0, 0, 5, '0%'],
    ['50% progress', 50, 2, 4, '50%'],
    ['100% progress', 100, 5, 5, '100%'],
    ['partial progress', 75, 3, 4, '75%'],
  ])('Progress display - %s', (scenario, progress, completed, total, expectedText) => {
    it('should display correct percentage', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={progress}
          completedCount={completed}
          totalCount={total}
          isWideScreen={false}
        />
      );

      expect(getByText(expectedText)).toBeTruthy();
    });
  });

  describe.each([
    ['NaN progress', NaN, 0, 5, '0%', '0 out of 5'],
    ['negative progress', -10, 0, 5, '0%', '0 out of 5'],
    ['over 100 progress', 150, 5, 5, '100%', '5 out of 5'],
    ['undefined completed', 50, undefined as any, 5, '50%', '0 out of 5'],
    ['undefined total', 50, 2, undefined as any, '50%', '2 out of 0'],
    ['negative completed', 50, -1, 5, '50%', '0 out of 5'],
    ['negative total', 50, 2, -1, '50%', '2 out of 0'],
  ])('Edge cases - %s', (scenario, progress, completed, total, expectedProgress, expectedText) => {
    it('should handle gracefully', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={progress}
          completedCount={completed}
          totalCount={total}
          isWideScreen={false}
        />
      );

      // Should not crash and should show safe values
      expect(getByText(expectedProgress)).toBeTruthy();
      expect(getByText(new RegExp(expectedText))).toBeTruthy();
    });
  });

  describe('Layout responsiveness', () => {
    it('should render wide screen layout', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={75}
          completedCount={3}
          totalCount={4}
          isWideScreen={true}
        />
      );

      // Wide screen shows longer text
      expect(getByText(/reach your weekly goals/)).toBeTruthy();
    });

    it('should render narrow screen layout', () => {
      const { getByText, queryByText } = render(
        <ChoresProgressCard
          progress={75}
          completedCount={3}
          totalCount={4}
          isWideScreen={false}
        />
      );

      // Narrow screen shows shorter text
      expect(getByText(/Keep it up!/)).toBeTruthy();
      expect(queryByText(/reach your weekly goals/)).toBeNull();
    });
  });

  describe('Content rendering', () => {
    it('should display Daily Progress title', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={50}
          completedCount={2}
          totalCount={4}
          isWideScreen={false}
        />
      );

      expect(getByText('Daily Progress')).toBeTruthy();
    });

    it('should display Today label', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={50}
          completedCount={2}
          totalCount={4}
          isWideScreen={false}
        />
      );

      expect(getByText('Today')).toBeTruthy();
    });

    it('should display completed and total counts in body text', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={60}
          completedCount={3}
          totalCount={5}
          isWideScreen={false}
        />
      );

      expect(getByText(/3 out of 5 chores/)).toBeTruthy();
    });
  });

  describe('Progress rounding', () => {
    it('should round 33.33% to 33%', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={33.33}
          completedCount={1}
          totalCount={3}
          isWideScreen={false}
        />
      );

      expect(getByText('33%')).toBeTruthy();
    });

    it('should round 66.67% to 67%', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={66.67}
          completedCount={2}
          totalCount={3}
          isWideScreen={false}
        />
      );

      expect(getByText('67%')).toBeTruthy();
    });

    it('should handle 0.5% as 1%', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={0.5}
          completedCount={0}
          totalCount={100}
          isWideScreen={false}
        />
      );

      expect(getByText('1%')).toBeTruthy();
    });
  });

  describe('Zero state', () => {
    it('should handle 0 completed and 0 total', () => {
      const { getByText } = render(
        <ChoresProgressCard
          progress={0}
          completedCount={0}
          totalCount={0}
          isWideScreen={false}
        />
      );

      expect(getByText('0%')).toBeTruthy();
      expect(getByText(/0 out of 0 chores/)).toBeTruthy();
    });
  });
});
