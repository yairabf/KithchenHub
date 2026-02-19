import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HouseholdNameScreen } from '../HouseholdNameScreen';

const mockCompleteSignInWithPendingUser = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({
    params: { householdName: 'The Smiths' },
  }),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    pendingAuth: {
      authResponse: {
        household: { name: 'The Smiths' },
      },
    },
    completeSignInWithPendingUser: mockCompleteSignInWithPendingUser,
  }),
}));

jest.mock('../../../../services/householdApi', () => ({
  updateHousehold: jest.fn().mockResolvedValue({}),
}));
import { updateHousehold } from '../../../../services/householdApi';

describe('HouseholdNameScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initial render', () => {
    it('pre-fills the input with the route param household name', () => {
      const { getByPlaceholderText } = render(<HouseholdNameScreen />);
      const input = getByPlaceholderText('e.g. The Smiths, Cozy Cottage');
      expect(input.props.value).toBe('The Smiths');
    });

    it('shows the Save button', () => {
      const { getByText } = render(<HouseholdNameScreen />);
      expect(getByText('Save')).toBeTruthy();
    });
  });

  describe('validation', () => {
    it.each([
      ['below minimum length', 'A', `Name must be at least 2 characters`],
      ['above maximum length', 'A'.repeat(41), `Name must be at most 40 characters`],
    ])('shows error when name is %s', async (_label, name, expectedError) => {
      const { getByPlaceholderText, getByText } = render(<HouseholdNameScreen />);

      fireEvent.changeText(getByPlaceholderText('e.g. The Smiths, Cozy Cottage'), name);
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(getByText(expectedError)).toBeTruthy();
      });
    });

    it('disables Save button when name is invalid', () => {
      const { getByPlaceholderText, getByText } = render(<HouseholdNameScreen />);

      fireEvent.changeText(getByPlaceholderText('e.g. The Smiths, Cozy Cottage'), 'X');

      const saveButton = getByText('Save');
      expect(saveButton.props.accessibilityState?.disabled ?? false).toBeTruthy();
    });
  });

  describe('save flow', () => {
    it('calls updateHousehold when name has changed and calls completeSignInWithPendingUser', async () => {
      const { getByPlaceholderText, getByText } = render(<HouseholdNameScreen />);

      fireEvent.changeText(getByPlaceholderText('e.g. The Smiths, Cozy Cottage'), 'New Family');
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(updateHousehold).toHaveBeenCalledWith('New Family');
        expect(mockCompleteSignInWithPendingUser).toHaveBeenCalled();
      });
    });

    it('skips updateHousehold call when name is unchanged', async () => {
      const { getByText } = render(<HouseholdNameScreen />);

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(updateHousehold).not.toHaveBeenCalled();
        expect(mockCompleteSignInWithPendingUser).toHaveBeenCalled();
      });
    });

    it('shows API error message when updateHousehold fails', async () => {
      (updateHousehold as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

      const { getByPlaceholderText, getByText } = render(<HouseholdNameScreen />);

      fireEvent.changeText(getByPlaceholderText('e.g. The Smiths, Cozy Cottage'), 'New Family');
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(getByText('Server error')).toBeTruthy();
      });
    });
  });

  describe('skip button', () => {
    it('shows Skip button when name is unchanged', () => {
      const { getByText } = render(<HouseholdNameScreen />);
      expect(getByText('Skip for now')).toBeTruthy();
    });

    it('calls completeSignInWithPendingUser when Skip is pressed', () => {
      const { getByText } = render(<HouseholdNameScreen />);

      fireEvent.press(getByText('Skip for now'));

      expect(mockCompleteSignInWithPendingUser).toHaveBeenCalled();
    });

    it('hides Skip button when the name has been changed', () => {
      const { getByPlaceholderText, queryByText } = render(<HouseholdNameScreen />);

      fireEvent.changeText(getByPlaceholderText('e.g. The Smiths, Cozy Cottage'), 'New Family');

      expect(queryByText('Skip for now')).toBeNull();
    });
  });
});
