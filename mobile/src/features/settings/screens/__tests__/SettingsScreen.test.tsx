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
import { SettingsScreen } from '../SettingsScreen';
import { useAuth } from '../../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../../contexts/AuthContext');
jest.mock('../../../../common/components/Toast', () => ({
  Toast: ({ visible, message, type }: any) => (
    visible ? <div testID="toast" data-type={type}>{message}</div> : null
  ),
}));

describe('SettingsScreen', () => {
  const mockSignOut = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockImportGuestData = jest.fn();
  const mockClearGuestData = jest.fn();

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
  });

  describe('handleImportGuestData', () => {
    it('should successfully import guest data', async () => {
      mockImportGuestData.mockResolvedValue(undefined);
      const { getByText, getByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText('Import local guest data'));

      await waitFor(() => {
        expect(mockImportGuestData).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const toast = getByTestId('toast');
        expect(toast).toBeTruthy();
        expect(toast.props.children).toBe('Guest data imported successfully');
        expect(toast.props['data-type']).toBe('success');
      });
    });

    it('should show error toast when import fails', async () => {
      mockImportGuestData.mockRejectedValue(new Error('Import failed'));
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        hasGuestData: true,
      });

      const { getByText, getByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText('Import local guest data'));

      await waitFor(() => {
        expect(mockImportGuestData).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const toast = getByTestId('toast');
        expect(toast).toBeTruthy();
        expect(toast.props.children).toBe('Failed to import guest data. Please try again.');
        expect(toast.props['data-type']).toBe('error');
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
