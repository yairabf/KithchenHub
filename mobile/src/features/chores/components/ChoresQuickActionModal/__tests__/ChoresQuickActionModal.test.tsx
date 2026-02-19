import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { ChoresQuickActionModal } from '../ChoresQuickActionModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('dayjs', () => {
  const actual = jest.requireActual('dayjs');
  return actual;
});

const mockMembers = [
  { id: 'member-1', name: 'Alice', color: '#FF0000' },
  { id: 'member-2', name: 'Bob', color: '#0000FF' },
];

jest.mock('../../../../../contexts/HouseholdContext', () => ({
  useHousehold: () => ({ members: mockMembers }),
}));

jest.mock('../../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('../../../../../common/components/CenteredModal', () => {
  const { View, Text } = require('react-native');
  return {
    CenteredModal: ({ children, title, visible }: { children: React.ReactNode; title: string; visible: boolean }) => {
      if (!visible) return null;
      return (
        <View>
          <Text>{title}</Text>
          {children}
        </View>
      );
    },
  };
});

jest.mock('../../../../../common/components/DateTimePicker', () => {
  const { View } = require('react-native');
  return { DateTimePicker: () => <View testID="date-time-picker" /> };
});

jest.mock('../../../../../features/settings/components/ManageHouseholdModal', () => {
  const { View } = require('react-native');
  return { ManageHouseholdModal: () => <View testID="manage-household-modal" /> };
});

jest.mock('../../../../../common/utils/rtlIcons', () => ({
  getDirectionalIcon: (icon: string) => icon,
}));

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onAddChore: jest.fn(),
};

describe('ChoresQuickActionModal', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('visibility', () => {
    it('renders modal title when visible', () => {
      const { getByText } = render(<ChoresQuickActionModal {...defaultProps} />);
      expect(getByText('chores.quickActionModal.title')).toBeTruthy();
    });

    it('does not render content when not visible', () => {
      const { queryByText } = render(
        <ChoresQuickActionModal {...defaultProps} visible={false} />
      );
      expect(queryByText('chores.quickActionModal.title')).toBeNull();
    });
  });

  describe('chore text input', () => {
    it('allows typing a chore name', () => {
      const { getByPlaceholderText } = render(<ChoresQuickActionModal {...defaultProps} />);
      const input = getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder');
      fireEvent.changeText(input, 'Wash dishes');
      expect(input.props.value).toBe('Wash dishes');
    });

    it('shows debounced search results for matching chore templates', async () => {
      jest.useFakeTimers();
      const { getByPlaceholderText, queryByText } = render(
        <ChoresQuickActionModal {...defaultProps} />
      );

      fireEvent.changeText(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'Wash'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(queryByText('Wash dishes')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('selects a chore template when tapped in the dropdown', async () => {
      jest.useFakeTimers();
      const { getByPlaceholderText, queryByText } = render(
        <ChoresQuickActionModal {...defaultProps} />
      );

      fireEvent.changeText(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'Wash'
      );

      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(queryByText('Wash dishes')).toBeTruthy();
      });

      fireEvent.press(queryByText('Wash dishes')!);
      expect(getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder').props.value).toBe('Wash dishes');

      jest.useRealTimers();
    });
  });

  describe('assignee selection', () => {
    it('renders all household members as selectable chips', () => {
      const { getByText } = render(<ChoresQuickActionModal {...defaultProps} />);
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('chores.quickActionModal.unassigned')).toBeTruthy();
    });

    it('passes the correct assigneeId and assigneeName to onAddChore', () => {
      const onAddChore = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <ChoresQuickActionModal {...defaultProps} onAddChore={onAddChore} />
      );

      fireEvent.changeText(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'Clean kitchen'
      );
      fireEvent.press(getByText('Alice'));
      fireEvent.press(getByText('chores.quickActionModal.choreNamePlaceholder'));

      // Trigger add via text input submit
      fireEvent(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'submitEditing'
      );

      expect(onAddChore).toHaveBeenCalledWith(
        expect.objectContaining({
          assignee: 'Alice',
          assigneeId: 'member-1',
        })
      );
    });
  });

  describe('form submission', () => {
    it('calls onAddChore with correct payload and closes modal', () => {
      const onAddChore = jest.fn();
      const onClose = jest.fn();
      const { getByPlaceholderText } = render(
        <ChoresQuickActionModal
          {...defaultProps}
          onAddChore={onAddChore}
          onClose={onClose}
        />
      );

      fireEvent.changeText(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'Vacuum living room'
      );
      fireEvent(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'submitEditing'
      );

      expect(onAddChore).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Vacuum living room',
          section: expect.stringMatching(/^(today|thisWeek)$/),
        })
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('does not call onAddChore when chore text is empty', () => {
      const onAddChore = jest.fn();
      const { getByPlaceholderText } = render(
        <ChoresQuickActionModal {...defaultProps} onAddChore={onAddChore} />
      );

      fireEvent(
        getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder'),
        'submitEditing'
      );

      expect(onAddChore).not.toHaveBeenCalled();
    });

    it('resets form fields after successful submission', () => {
      const { getByPlaceholderText } = render(
        <ChoresQuickActionModal {...defaultProps} />
      );
      const input = getByPlaceholderText('chores.quickActionModal.choreNamePlaceholder');

      fireEvent.changeText(input, 'Mop floors');
      fireEvent(input, 'submitEditing');

      expect(input.props.value).toBe('');
    });
  });
});
