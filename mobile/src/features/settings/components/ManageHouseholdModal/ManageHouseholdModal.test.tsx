import React from 'react';
import { render } from '@testing-library/react-native';

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

  it('renders actual joined users with email and role details', () => {
    mockUseHousehold.mockReturnValue({
      members: [
        {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          role: 'Admin',
          isCurrentUser: true,
        },
        {
          id: 'user-2',
          name: 'Bob',
          email: 'bob@example.com',
          role: 'Member',
          isCurrentUser: false,
        },
      ],
      isLoading: false,
      removeMember: jest.fn(),
    });

    const { getByText, queryByPlaceholderText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('alice@example.com')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('You')).toBeTruthy();

    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('bob@example.com')).toBeTruthy();
    expect(getByText('Member')).toBeTruthy();

    expect(queryByPlaceholderText('Add new member...')).toBeNull();
  });

  it('disables member removal affordances for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-2', role: 'Member' },
    });

    const removeMember = jest.fn();
    mockUseHousehold.mockReturnValue({
      members: [
        {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          role: 'Admin',
          isCurrentUser: false,
        },
      ],
      isLoading: false,
      removeMember,
    });

    const { getByText, getByLabelText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('Only household admins can remove members.')).toBeTruthy();
    expect(getByLabelText('Remove member').props.accessibilityState?.disabled ?? getByLabelText('Remove member').props.disabled).toBeTruthy();
    expect(removeMember).not.toHaveBeenCalled();
  });
});
