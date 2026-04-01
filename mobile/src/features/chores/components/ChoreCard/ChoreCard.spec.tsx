import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoreCard } from './ChoreCard';
import type { Chore } from '../../../../mocks/chores';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'card.editLabel') {
        return `Edit ${String(params?.title ?? '')}`;
      }

      if (key === 'card.dueBy') {
        return 'Due by';
      }

      if (key === 'modal.assigneeUnassigned') {
        return 'Unassigned';
      }

      if (key === 'modal.recurrence.weekly') {
        return 'Weekly';
      }

      if (key === 'modal.recurrence.daily') {
        return 'Daily';
      }

      if (key === 'card.oneTime') {
        return 'One-time';
      }

      if (key === 'status.done') {
        return 'Done';
      }

      if (key === 'status.pending') {
        return 'Pending';
      }

      if (key === 'card.toggleDoneHint') {
        return 'Mark as pending';
      }

      if (key === 'card.togglePendingHint') {
        return 'Mark as done';
      }

      if (key === 'card.editHint') {
        return 'Edit chore';
      }

      return key;
    },
    i18n: {
      dir: () => 'ltr',
    },
  }),
}));

jest.mock('../../../../common/utils/choreDisplayUtils', () => ({
  formatChoreDueDateTime: jest.fn(() => 'Today 14:03'),
}));

jest.mock('../../../../common/components/SwipeableWrapper', () => ({
  SwipeableWrapper: ({
    children,
    onSwipeDelete,
  }: {
    children: React.ReactNode;
    onSwipeDelete: () => void;
  }) => {
    const { View: MockView, Pressable: MockPressable } = require('react-native');
    return (
      <MockView>
        <MockPressable accessibilityRole="button" accessibilityLabel="swipe-delete" onPress={onSwipeDelete} />
        {children}
      </MockView>
    );
  },
}));

jest.mock('../../../../common/components/ListItemCardWrapper', () => ({
  ListItemCardWrapper: ({
    children,
    onPress,
    testID,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
    testID?: string;
    accessibilityLabel?: string;
    accessibilityRole?: 'button';
    accessibilityHint?: string;
  }) => {
    const { Pressable: MockPressable } = require('react-native');
    return (
      <MockPressable
        onPress={onPress}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </MockPressable>
    );
  },
}));

function createMockChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: 'chore-1',
    localId: 'local-chore-1',
    title: 'Folding clothes',
    assignee: 'Jonathan Smith',
    dueDate: 'Today',
    dueTime: '14:03',
    isRecurring: true,
    recurrencePattern: 'weekly',
    isCompleted: false,
    section: 'today',
    icon: '👕',
    ...overrides,
  };
}

function hasLineThrough(style: unknown): boolean {
  const flattenedStyle = StyleSheet.flatten(style as object | object[] | null | undefined);
  return flattenedStyle?.textDecorationLine === 'line-through';
}

describe('ChoreCard — Pastel Tinted design', () => {
  describe.each([
    ['pending', { isCompleted: false }],
    ['completed', { isCompleted: true }],
  ] as const)('%s chore', (_label, overrides) => {
    it('renders the chore title', () => {
      const chore = createMockChore(overrides);
      const { getByText } = render(
        <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
      );

      expect(getByText(chore.title)).toBeTruthy();
    });

    it('renders due date in the meta area', () => {
      const chore = createMockChore(overrides);
      const { getByText } = render(
        <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
      );

      expect(getByText('Due by Today 14:03')).toBeTruthy();
    });

    it('renders recurrence tag', () => {
      const chore = createMockChore(overrides);
      const { getByText } = render(
        <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
      );

      expect(getByText('Weekly')).toBeTruthy();
    });

    it('renders assignee tag', () => {
      const chore = createMockChore(overrides);
      const { getByText } = render(
        <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
      );

      expect(getByText(chore.assignee as string)).toBeTruthy();
    });

    it('renders edit button', () => {
      const chore = createMockChore(overrides);
      const { getByLabelText } = render(
        <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
      );

      expect(getByLabelText(`Edit ${chore.title}`)).toBeTruthy();
    });

    it('renders checkbox state', () => {
      const chore = createMockChore(overrides);
      const { getByTestId } = render(
        <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
      );

      expect(getByTestId(`chore-card-${chore.id}`)).toBeTruthy();
    });
  });

  it('shows strikethrough on the title when completed', () => {
    const chore = createMockChore({ isCompleted: true });
    const { getByText } = render(
      <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
    );

    expect(hasLineThrough(getByText(chore.title).props.style)).toBe(true);
  });

  it('does not show strikethrough when pending', () => {
    const chore = createMockChore({ isCompleted: false });
    const { getByText } = render(
      <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />
    );

    expect(hasLineThrough(getByText(chore.title).props.style)).toBe(false);
  });

  it('calls onToggle when card is pressed', () => {
    const chore = createMockChore();
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={onToggle} onEdit={jest.fn()} onDelete={jest.fn()} />
    );

    fireEvent.press(getByTestId(`chore-card-${chore.id}`));

    expect(onToggle).toHaveBeenCalledWith(chore.id);
  });

  it('calls onEdit when edit button is pressed and does not toggle', () => {
    const chore = createMockChore();
    const onEdit = jest.fn();
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={onToggle} onEdit={onEdit} onDelete={jest.fn()} />
    );

    fireEvent.press(getByLabelText(`Edit ${chore.title}`), {
      stopPropagation: jest.fn(),
    });

    expect(onEdit).toHaveBeenCalledWith(chore);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('calls onDelete when swipe-delete is triggered', () => {
    const chore = createMockChore();
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <ChoreCard chore={chore} bgColor="#FFFFFF" onToggle={jest.fn()} onEdit={jest.fn()} onDelete={onDelete} />
    );

    fireEvent.press(getByLabelText('swipe-delete'));

    expect(onDelete).toHaveBeenCalledWith(chore.id);
  });
});
