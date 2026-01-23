/**
 * Test file for SettingsScreen
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
 * 
 * 2. Mock dependencies:
 *    - AuthContext
 *    - Toast component
 *    - CenteredModal
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock dependencies
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../../../contexts/HouseholdContext', () => ({
  useHousehold: jest.fn(() => ({
    members: [],
    isLoading: false,
    addMember: jest.fn(),
    removeMember: jest.fn(),
    getMemberById: jest.fn(),
  })),
}));
jest.mock('../../../../common/components/Toast', () => ({
  Toast: ({ visible, message, type }: any) => (
    visible ? <div testID="toast" data-type={type}>{message}</div> : null
  ),
}));
const manageHouseholdModalPath = require.resolve('../../components/ManageHouseholdModal');
jest.mock(manageHouseholdModalPath, () => ({
  ManageHouseholdModal: () => null,
}));
const importServicePath = require.resolve('../../../../services/import/importService');
jest.mock(importServicePath, () => ({
  ImportService: {
    gatherLocalData: jest.fn(async () => ({})),
    submitImport: jest.fn(async () => undefined),
  },
}));
jest.mock('../../components/ImportDataModal', () => ({
  ImportDataModal: ({ visible }: { visible: boolean }) =>
    (visible ? <div testID="import-data-modal" /> : null),
}));

const { SettingsScreen } = require('../SettingsScreen');
const { useAuth } = require('../../../../contexts/AuthContext');

describe('SettingsScreen', () => {
  const mockSignOut = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockImportGuestData = jest.fn();
  const mockClearGuestData = jest.fn();
  const originalWarn = console.warn;
  const consoleWarnSpy = jest.spyOn(console, 'warn');

  const defaultAuthContext = {
    user: { id: '1', email: 'test@example.com', name: 'Test User', isGuest: false },
    signOut: mockSignOut,
    signInWithGoogle: mockSignInWithGoogle,
    hasGuestData: false,
    importGuestData: mockImportGuestData,
    clearGuestData: mockClearGuestData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(defaultAuthContext);
    consoleWarnSpy.mockImplementation((message, ...args) => {
      if (typeof message === 'string' && message.includes('SafeAreaView has been deprecated')) {
        return;
      }
      originalWarn(message, ...args);
    });
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('handleImportGuestData', () => {
    it('should open import modal when guest data exists', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: true,
      });

      const { getByText, queryByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText('Import local guest data'));

      await waitFor(() => {
        expect(queryByTestId('import-data-modal')).toBeTruthy();
      });
    });
  });

  describe('handleClearGuestData', () => {
    it('should successfully clear guest data', async () => {
      mockClearGuestData.mockResolvedValue(undefined);
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: true,
      });

      const { getByText, getByTestId } = render(<SettingsScreen />);

      // Open confirmation modal
      fireEvent.press(getByText('Delete local guest data'));

      // Confirm deletion
      const confirmButton = getByText('Delete');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockClearGuestData).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const toast = getByTestId('toast');
        expect(toast).toBeTruthy();
        expect(toast.props.children).toBe('Guest data deleted');
        expect(toast.props['data-type']).toBe('success');
      });
    });

    it('should show error toast when clear fails', async () => {
      mockClearGuestData.mockRejectedValue(new Error('Clear failed'));
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: true,
      });

      const { getByText, getByTestId } = render(<SettingsScreen />);

      // Open confirmation modal
      fireEvent.press(getByText('Delete local guest data'));

      // Confirm deletion
      const confirmButton = getByText('Delete');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockClearGuestData).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const toast = getByTestId('toast');
        expect(toast).toBeTruthy();
        expect(toast.props.children).toBe('Failed to delete guest data. Please try again.');
        expect(toast.props['data-type']).toBe('error');
      });
    });

    it('should close confirmation modal after successful deletion', async () => {
      mockClearGuestData.mockResolvedValue(undefined);
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: true,
      });

      const { getByText, queryByText } = render(<SettingsScreen />);

      // Open confirmation modal
      fireEvent.press(getByText('Delete local guest data'));
      expect(getByText('Delete guest data?')).toBeTruthy();

      // Confirm deletion
      fireEvent.press(getByText('Delete'));

      await waitFor(() => {
        expect(queryByText('Delete guest data?')).toBeNull();
      });
    });
  });

  describe('Guest Data section visibility', () => {
    it('should show Guest Data section when user is signed in and has guest data', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: true,
      });

      const { getByText } = render(<SettingsScreen />);
      expect(getByText('Guest Data')).toBeTruthy();
      expect(getByText('Import local guest data')).toBeTruthy();
      expect(getByText('Delete local guest data')).toBeTruthy();
    });

    it('should not show Guest Data section when user is guest', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        user: { ...defaultAuthContext.user, isGuest: true },
        hasGuestData: true,
      });

      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText('Guest Data')).toBeNull();
    });

    it('should not show Guest Data section when no guest data exists', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: false,
      });

      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText('Guest Data')).toBeNull();
    });
  });

  describe('Sign in prompt', () => {
    it('should show sign in prompt for guest users', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        user: { ...defaultAuthContext.user, isGuest: true },
      });

      const { getByText } = render(<SettingsScreen />);
      expect(getByText('Sign in to sync your data')).toBeTruthy();
    });

    it('should call signInWithGoogle when sign in prompt is pressed', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        user: { ...defaultAuthContext.user, isGuest: true },
      });

      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Sign in to sync your data'));

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });
});
