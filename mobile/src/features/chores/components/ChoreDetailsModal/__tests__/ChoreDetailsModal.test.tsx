/**
 * ChoreDetailsModal Tests
 *
 * Validates both modal modes (add and edit) including:
 * - Rendering and initial state per mode
 * - Submit disabled when name is empty
 * - Correct handler invoked on submit
 * - Form reset on modal close/reopen
 * - No call made when form is invalid
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChoreDetailsModal } from '../ChoreDetailsModal';
import type { Chore } from '../../../../../mocks/chores';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'modal.addTitle': 'Add Chore',
        'modal.editTitle': 'Edit Chore',
        'modal.submitAdd': 'Add',
        'modal.submitSave': 'Save',
        'modal.cancel': 'Cancel',
        'modal.choreNamePlaceholder': 'Chore name',
        'modal.iconLabel': 'ICON:',
        'modal.repeatLabel': 'REPEAT:',
        'modal.assignLabel': 'Assign to:',
        'modal.assigneeUnassigned': 'Unassigned',
        'modal.assigneeManage': 'Manage',
        'modal.recurrence.none': 'None',
        'modal.recurrence.daily': 'Daily',
        'modal.recurrence.weekly': 'Weekly',
        'modal.recurrence.monthly': 'Monthly',
        'modal.dueDateLabel': 'Due Date & Time',
        'modal.dueDatePlaceholder': 'Select date and time...',
      };
      return labels[key] ?? key;
    },
    i18n: { dir: () => 'ltr' },
  }),
}));

jest.mock('../../../../../contexts/HouseholdContext', () => ({
  useHousehold: () => ({
    members: [
      { id: 'member-1', name: 'Alice', color: '#FF0000' },
      { id: 'member-2', name: 'Bob', color: '#00FF00' },
    ],
  }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('../../../../../common/components/DateTimePicker', () => ({
  DateTimePicker: ({ label }: { label: string }) => <>{label}</>,
}));

jest.mock('../../../../settings/components/ManageHouseholdModal', () => ({
  ManageHouseholdModal: () => null,
}));

jest.mock('../../../../../common/components/CenteredModal', () => {
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    CenteredModal: ({ children, title, confirmText, onConfirm, confirmDisabled }: {
      children: React.ReactNode;
      title: string;
      confirmText?: string;
      onConfirm?: () => void;
      confirmDisabled?: boolean;
    }) => (
      <View>
        <Text>{title}</Text>
        <View>{children}</View>
        <TouchableOpacity
          onPress={onConfirm}
          disabled={confirmDisabled}
          accessibilityLabel={confirmText}
          testID="submit-button"
        >
          <Text>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockChore: Chore = {
  id: 'chore-1',
  localId: 'local-chore-1',
  title: 'Vacuum the living room',
  assignee: 'Alice',
  dueDate: 'Jan 20, 2026',
  dueTime: '10:00 AM',
  isCompleted: false,
  section: 'today',
  icon: '🧹',
  isRecurring: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ChoreDetailsModal', () => {
  describe.each([
    ['add', undefined] as const,
    ['edit', mockChore] as const,
  ])('in %s mode', (mode, chore) => {
    it('renders without crashing', () => {
      const props = mode === 'add'
        ? { mode: 'add' as const, visible: true, onClose: jest.fn(), onAddChore: jest.fn() }
        : { mode: 'edit' as const, visible: true, onClose: jest.fn(), chore, onUpdateChore: jest.fn() };

      expect(() => render(<ChoreDetailsModal {...props} />)).not.toThrow();
    });

    it(`shows the correct modal title for ${mode} mode`, () => {
      const props = mode === 'add'
        ? { mode: 'add' as const, visible: true, onClose: jest.fn(), onAddChore: jest.fn() }
        : { mode: 'edit' as const, visible: true, onClose: jest.fn(), chore, onUpdateChore: jest.fn() };

      const { getByText } = render(<ChoreDetailsModal {...props} />);
      const expectedTitle = mode === 'add' ? 'Add Chore' : 'Edit Chore';
      expect(getByText(expectedTitle)).toBeTruthy();
    });
  });

  describe('add mode', () => {
    const onAddChore = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const renderAddModal = () =>
      render(
        <ChoreDetailsModal
          mode="add"
          visible={true}
          onClose={onClose}
          onAddChore={onAddChore}
        />,
      );

    it('shows empty name input on open', () => {
      const { getByPlaceholderText } = renderAddModal();
      const input = getByPlaceholderText('Chore name');
      expect(input.props.value).toBe('');
    });

    it('does not call onAddChore when submit pressed with empty name', () => {
      const { getByTestId } = renderAddModal();
      fireEvent.press(getByTestId('submit-button'));
      expect(onAddChore).not.toHaveBeenCalled();
    });

    it('calls onAddChore when submit pressed after typing a name', () => {
      const { getByPlaceholderText, getByTestId } = renderAddModal();
      fireEvent.changeText(getByPlaceholderText('Chore name'), 'Take out trash');
      fireEvent.press(getByTestId('submit-button'));
      expect(onAddChore).toHaveBeenCalledTimes(1);
    });

    it('calls onAddChore with trimmed name on submit', () => {
      const { getByPlaceholderText, getByText } = renderAddModal();
      fireEvent.changeText(getByPlaceholderText('Chore name'), '  Clean kitchen  ');
      fireEvent.press(getByText('Add'));
      expect(onAddChore).toHaveBeenCalledTimes(1);
      expect(onAddChore).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Clean kitchen' }),
      );
    });

    it('calls onClose after successful submit', () => {
      const { getByPlaceholderText, getByText } = renderAddModal();
      fireEvent.changeText(getByPlaceholderText('Chore name'), 'Clean kitchen');
      fireEvent.press(getByText('Add'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onAddChore when name is whitespace only', () => {
      const { getByPlaceholderText, getByText } = renderAddModal();
      fireEvent.changeText(getByPlaceholderText('Chore name'), '   ');
      fireEvent.press(getByText('Add'));
      expect(onAddChore).not.toHaveBeenCalled();
    });

    it('includes selected recurrence pattern in submitted data', () => {
      const { getByPlaceholderText, getByText } = renderAddModal();
      fireEvent.changeText(getByPlaceholderText('Chore name'), 'Mop floor');
      fireEvent.press(getByText('Weekly'));
      fireEvent.press(getByText('Add'));
      expect(onAddChore).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrencePattern: 'weekly',
          isRecurring: true,
        }),
      );
    });

    it('sets isRecurring false when recurrence is None', () => {
      const { getByPlaceholderText, getByText } = renderAddModal();
      fireEvent.changeText(getByPlaceholderText('Chore name'), 'Clean windows');
      fireEvent.press(getByText('Weekly'));
      fireEvent.press(getByText('None'));
      fireEvent.press(getByText('Add'));
      expect(onAddChore).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrencePattern: null,
          isRecurring: false,
        }),
      );
    });
  });

  describe('edit mode', () => {
    const onUpdateChore = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const renderEditModal = (chore: Chore = mockChore) =>
      render(
        <ChoreDetailsModal
          mode="edit"
          visible={true}
          onClose={onClose}
          chore={chore}
          onUpdateChore={onUpdateChore}
        />,
      );

    it('pre-populates name input with existing chore title', () => {
      const { getByDisplayValue } = renderEditModal();
      expect(getByDisplayValue('Vacuum the living room')).toBeTruthy();
    });

    it('submit button is enabled when name is pre-populated', () => {
      const { getByTestId } = renderEditModal();
      expect(getByTestId('submit-button').props.disabled).not.toBe(true);
    });

    it('does not call onUpdateChore when name is cleared and submit pressed', () => {
      const { getByDisplayValue, getByTestId } = renderEditModal();
      fireEvent.changeText(getByDisplayValue('Vacuum the living room'), '');
      fireEvent.press(getByTestId('submit-button'));
      expect(onUpdateChore).not.toHaveBeenCalled();
    });

    it('calls onUpdateChore with only changed fields on save', () => {
      const { getByDisplayValue, getByText } = renderEditModal();
      fireEvent.changeText(
        getByDisplayValue('Vacuum the living room'),
        'Vacuum everywhere',
      );
      fireEvent.press(getByText('Save'));
      expect(onUpdateChore).toHaveBeenCalledWith(
        'chore-1',
        expect.objectContaining({ title: 'Vacuum everywhere' }),
      );
    });

    it('does not call onUpdateChore when nothing changed', () => {
      const { getByText } = renderEditModal();
      fireEvent.press(getByText('Save'));
      expect(onUpdateChore).not.toHaveBeenCalled();
    });

    it('calls onClose after save regardless of changes', () => {
      const { getByText } = renderEditModal();
      fireEvent.press(getByText('Save'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('returns null when chore prop is null', () => {
      const { toJSON } = render(
        <ChoreDetailsModal
          mode="edit"
          visible={true}
          onClose={onClose}
          chore={null}
          onUpdateChore={onUpdateChore}
        />,
      );
      expect(toJSON()).toBeNull();
    });
  });

  describe.each([
    ['none', null, false],
    ['daily', 'daily', true],
    ['weekly', 'weekly', true],
    ['monthly', 'monthly', true],
  ] as const)(
    'recurrence option: %s',
    (label, expectedPattern, expectedIsRecurring) => {
      it(`submits recurrencePattern=${JSON.stringify(expectedPattern)} when "${label}" selected`, () => {
        const onAddChore = jest.fn();
        const { getByPlaceholderText, getByText } = render(
          <ChoreDetailsModal
            mode="add"
            visible={true}
            onClose={jest.fn()}
            onAddChore={onAddChore}
          />,
        );
        fireEvent.changeText(getByPlaceholderText('Chore name'), 'Test chore');
        if (label !== 'none') {
          fireEvent.press(getByText(label.charAt(0).toUpperCase() + label.slice(1)));
        }
        fireEvent.press(getByText('Add'));
        expect(onAddChore).toHaveBeenCalledWith(
          expect.objectContaining({
            recurrencePattern: expectedPattern,
            isRecurring: expectedIsRecurring,
          }),
        );
      });
    },
  );
});
