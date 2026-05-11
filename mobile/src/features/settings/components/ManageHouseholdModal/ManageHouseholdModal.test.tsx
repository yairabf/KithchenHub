import React from 'react';
import { Alert, Image } from 'react-native';
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
        'manageHouseholdModal.memberCount': '2 members',
        'manageHouseholdModal.inviteHouseholdMember': 'Invite household member',
        'manageHouseholdModal.shareInviteCode': 'Share invite code',
        'manageHouseholdModal.emptyState': 'No household members yet',
        'manageHouseholdModal.currentUserBadge': 'You',
        'manageHouseholdModal.adminRole': 'Admin',
        'manageHouseholdModal.memberRole': 'Member',
        'manageHouseholdModal.removeMember': 'Remove member',
        'manageHouseholdModal.removeMemberUnavailable': 'Remove member unavailable',
        'manageHouseholdModal.protectedMemberTitle': 'Cannot remove this member',
        'manageHouseholdModal.protectedMemberMessage': 'The household admin or manager cannot be deleted from the household.',
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

  it('renders current user as a compact member card with initials, badges, and popup-only removal guidance', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
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
      removeMember: jest.fn(),
    });

    const { getByText, getByLabelText, queryByText, queryByPlaceholderText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('Household Members')).toBeTruthy();
    expect(getByText('2 members')).toBeTruthy();
    expect(getByText('Invite household member')).toBeTruthy();
    expect(getByText('Share invite code')).toBeTruthy();
    expect(getByText('AS')).toBeTruthy();
    const memberName = getByText('Alice Smith');
    expect(memberName).toBeTruthy();
    expect(memberName.props.numberOfLines).toBeUndefined();
    expect(getByText('alice@example.com')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('You')).toBeTruthy();
    expect(queryByText('You cannot remove yourself here')).toBeNull();
    expect(queryByPlaceholderText('Add new member...')).toBeNull();

    fireEvent.press(getByLabelText('Remove member unavailable'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Cannot remove this member',
      'The household admin or manager cannot be deleted from the household.',
    );
  });

  it('renders Google/account avatars before falling back to initials', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', role: 'Admin', avatarUrl: 'https://example.com/google-avatar.jpg' },
    });
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
          avatarUrl: 'https://example.com/bob.jpg',
          isCurrentUser: false,
        },
      ],
      isLoading: false,
      removeMember: jest.fn(),
    });

    const { getByTestId, queryByText, UNSAFE_queryAllByType } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByTestId('member-avatar-image-user-1').props.source).toEqual({
      uri: 'https://example.com/google-avatar.jpg',
    });
    expect(getByTestId('member-avatar-image-user-2').props.source).toEqual({
      uri: 'https://example.com/bob.jpg',
    });
    expect(queryByText('AS')).toBeNull();
    expect(queryByText('BJ')).toBeNull();
    expect(UNSAFE_queryAllByType(Image)).toHaveLength(2);
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

  it('shows a popup instead of removing protected admin or manager members', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
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
          name: 'Maya Manager',
          email: 'maya@example.com',
          role: 'Admin',
          isCurrentUser: false,
        },
      ],
      isLoading: false,
      removeMember,
    });

    const { getAllByLabelText, getByText } = render(
      <ManageHouseholdModal visible onClose={jest.fn()} />,
    );

    expect(getByText('MM')).toBeTruthy();
    fireEvent.press(getAllByLabelText('Remove member unavailable')[1]);

    expect(alertSpy).toHaveBeenCalledWith(
      'Cannot remove this member',
      'The household admin or manager cannot be deleted from the household.',
    );
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('calls invite and share action callbacks from the selected footer buttons', () => {
    const onInviteMember = jest.fn();
    const onShareInviteCode = jest.fn();
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
      removeMember: jest.fn(),
    });

    const { getByText } = render(
      <ManageHouseholdModal
        visible
        onClose={jest.fn()}
        onInviteMember={onInviteMember}
        onShareInviteCode={onShareInviteCode}
      />,
    );

    fireEvent.press(getByText('Invite household member'));
    fireEvent.press(getByText('Share invite code'));

    expect(onInviteMember).toHaveBeenCalledTimes(1);
    expect(onShareInviteCode).toHaveBeenCalledTimes(1);
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
