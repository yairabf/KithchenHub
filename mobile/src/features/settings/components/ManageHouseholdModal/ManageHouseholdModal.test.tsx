import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ManageHouseholdModal } from './ManageHouseholdModal';

const mockUseAuth = jest.fn();
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseHousehold = jest.fn();
jest.mock('../../../../contexts/HouseholdContext', () => ({
  useHousehold: () => mockUseHousehold(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'manageHouseholdModal.title': 'Manage Household',
        'manageHouseholdModal.membersSectionTitle': 'Household Members',
        'manageHouseholdModal.emptyState': 'No household members yet',
        'manageHouseholdModal.currentUserBadge': 'You',
        'manageHouseholdModal.adminRole': 'Admin',
        'manageHouseholdModal.memberRole': 'Member',
        'manageHouseholdModal.removeMember': 'Remove member',
        'manageHouseholdModal.cannotRemoveYourself': 'You cannot remove yourself here',
        'manageHouseholdModal.onlyAdminsCanRemoveMembers': 'Only household admins can remove members.',
      }[key] ?? key),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../../../common/components/CenteredModal', () => ({
  CenteredModal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <>{children}</> : null,
}));

describe('ManageHouseholdModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', role: 'Admin' },
    });
  });

  it('renders current user as a compact member card with initials, badges, and inline self-removal guidance', () => {
    mockUseHousehold.mockReturnValue({
      members: [
        {
          id: 'user-1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Admin',
          isCurrentUser: true,
        },
      ],
      isLoading: false,
      removeMember: jest.fn(),
    });

    const { getByText, queryByLabelText, queryByPlaceholderText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('AS')).toBeTruthy();
    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('alice@example.com')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('You')).toBeTruthy();
    expect(getByText('You cannot remove yourself here')).toBeTruthy();
    expect(queryByLabelText('Remove member')).toBeNull();
    expect(queryByPlaceholderText('Add new member...')).toBeNull();
  });

  it('lets admins remove other household members with an explicit remove action', () => {
    const removeMember = jest.fn();
    mockUseHousehold.mockReturnValue({
      members: [
        {
          id: 'user-1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Admin',
          isCurrentUser: true,
        },
        {
          id: 'user-2',
          name: 'Bob Jones',
          email: 'bob@example.com',
          role: 'Member',
          isCurrentUser: false,
        },
      ],
      isLoading: false,
      removeMember,
    });

    const { getByText, getByLabelText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('BJ')).toBeTruthy();
    expect(getByText('Bob Jones')).toBeTruthy();
    expect(getByText('bob@example.com')).toBeTruthy();
    expect(getByText('Member')).toBeTruthy();

    fireEvent.press(getByLabelText('Remove member'));

    expect(removeMember).toHaveBeenCalledWith('user-2');
  });

  it('hides member removal affordances for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-2', role: 'Member' },
    });

    const removeMember = jest.fn();
    mockUseHousehold.mockReturnValue({
      members: [
        {
          id: 'user-1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Admin',
          isCurrentUser: false,
        },
      ],
      isLoading: false,
      removeMember,
    });

    const { getByText, queryByLabelText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('Only household admins can remove members.')).toBeTruthy();
    expect(queryByLabelText('Remove member')).toBeNull();
    expect(removeMember).not.toHaveBeenCalled();
  });
});
