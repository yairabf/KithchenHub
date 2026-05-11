import React from 'react';
import { Share } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { InviteMemberModal } from './InviteMemberModal';

const mockInviteMember = jest.fn();
jest.mock('../../../services/householdService', () => ({
  householdService: {
    inviteMember: () => mockInviteMember(),
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../../common/components/CenteredModal', () => ({
  CenteredModal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <>{children}</> : null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      ({
        'inviteMemberModal.title': 'Invite Member',
        'inviteMemberModal.description': 'Share this code with household members.',
        'inviteMemberModal.shareMessage': `Join my household with code ${params?.code}`,
        'inviteMemberModal.shareTitle': 'KitchenHub invite',
        'inviteMemberModal.copiedToClipboard': 'Copied',
        'inviteMemberModal.copyCode': 'Copy code',
        'inviteMemberModal.shareViaApps': 'Share via apps',
        'inviteMemberModal.generateNewCode': 'Generate new code',
        'inviteMemberModal.generateInviteCode': 'Generate invite code',
      }[key] ?? key),
  }),
}));

describe('InviteMemberModal', () => {
  const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

  beforeEach(() => {
    jest.clearAllMocks();
    mockInviteMember.mockResolvedValue({ inviteToken: 'ABC123' });
  });

  afterAll(() => {
    shareSpy.mockRestore();
  });

  it('uses the existing invite-code flow and immediately shares when opened for sharing', async () => {
    render(<InviteMemberModal visible onClose={jest.fn()} initialAction="share" />);

    await waitFor(() => {
      expect(mockInviteMember).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith({
        message: 'Join my household with code ABC123',
        title: 'KitchenHub invite',
      });
    });
  });
});
