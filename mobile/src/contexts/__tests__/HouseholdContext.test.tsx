import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';

import { HouseholdProvider, useHousehold } from '../HouseholdContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetHousehold = jest.fn();
const mockInviteMember = jest.fn();
const mockRemoveMember = jest.fn();
jest.mock('../../services/householdService', () => ({
  householdService: {
    getHousehold: (...args: unknown[]) => mockGetHousehold(...args),
    inviteMember: (...args: unknown[]) => mockInviteMember(...args),
    removeMember: (...args: unknown[]) => mockRemoveMember(...args),
  },
}));

describe('HouseholdContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads actual joined household users for authenticated members instead of default placeholder members', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        householdId: 'household-1',
        role: 'Admin',
        isGuest: false,
      },
    });

    mockGetHousehold.mockResolvedValue({
      id: 'household-1',
      name: 'Home',
      members: [
        {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          role: 'Admin',
        },
        {
          id: 'user-2',
          name: 'Bob',
          email: 'bob@example.com',
          role: 'Member',
        },
      ],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HouseholdProvider>{children}</HouseholdProvider>
    );

    const { result } = renderHook(() => useHousehold(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetHousehold).toHaveBeenCalledTimes(1);
    expect(result.current.members).toEqual([
      expect.objectContaining({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'Admin',
        isCurrentUser: true,
      }),
      expect.objectContaining({
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        role: 'Member',
        isCurrentUser: false,
      }),
    ]);
    expect(result.current.members.map((member) => member.name)).not.toEqual(
      expect.arrayContaining(['Mom', 'Dad', 'Kids', 'All']),
    );
  });

  it('returns no members when the authenticated user has not joined a household yet', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        householdId: undefined,
        role: 'Member',
        isGuest: false,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HouseholdProvider>{children}</HouseholdProvider>
    );

    const { result } = renderHook(() => useHousehold(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetHousehold).not.toHaveBeenCalled();
    expect(result.current.members).toEqual([]);
  });
});
