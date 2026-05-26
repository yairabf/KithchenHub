import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Switch, TextInput } from 'react-native';

import { SupportTicketScreen } from '../SupportTicketScreen';
import { submitSupportTicket } from '../../supportTicketApi';

const mockGoBack = jest.fn();

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'user@example.com' } }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../supportTicketApi', () => ({
  submitSupportTicket: jest.fn(),
}));

const mockSubmitSupportTicket = submitSupportTicket as jest.MockedFunction<typeof submitSupportTicket>;

jest.setTimeout(30000);

async function fillReadyTicket() {
  const screen = render(<SupportTicketScreen />);
  const { UNSAFE_getAllByType, UNSAFE_getByType, getByText } = screen;

  await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith('fullhouse.supportTicketDraft.v1'));

  fireEvent.press(getByText('support.continue'));

  const detailsInputs = UNSAFE_getAllByType(TextInput);
  fireEvent.changeText(detailsInputs[0], 'Shopping list freezes');
  fireEvent.changeText(detailsInputs[1], 'Milk should be added immediately');
  fireEvent.changeText(detailsInputs[2], 'The spinner stays visible');
  fireEvent.press(getByText('support.continue'));

  const contextInputs = UNSAFE_getAllByType(TextInput);
  fireEvent.changeText(contextInputs[0], 'Open Shopping, add milk');
  fireEvent.changeText(contextInputs[1], 'user@example.com');
  fireEvent(UNSAFE_getByType(Switch), 'valueChange', true);
  fireEvent.press(getByText('support.continue'));

  return screen;
}

describe('SupportTicketScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    mockSubmitSupportTicket.mockResolvedValue({
      referenceId: 'support-2026-05-25T00-00-00-000Z',
      submittedAt: '2026-05-25T00:00:00.000Z',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('submits the primary support ticket to the backend without opening mailto', async () => {
    const { getByText, queryByText } = await fillReadyTicket();

    fireEvent.press(getByText('support.submitTicket'));

    await waitFor(() => {
      expect(mockSubmitSupportTicket).toHaveBeenCalledWith(expect.objectContaining({
        summary: 'Shopping list freezes',
        contactEmail: 'user@example.com',
        privacyAcknowledged: true,
      }));
    });

    expect(Linking.canOpenURL).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('fullhouse.supportTicketDraft.v1');
    expect(getByText('support.successMessage')).toBeTruthy();
    await waitFor(() => expect(queryByText('Shopping list freezes')).toBeNull());
    expect(queryByText('support.errorMessage')).toBeNull();
  });

  it('keeps the draft and shows an error when backend ticket submission fails', async () => {
    mockSubmitSupportTicket.mockRejectedValueOnce(new Error('Network request failed'));
    const { getByText, queryByText } = await fillReadyTicket();

    fireEvent.press(getByText('support.submitTicket'));

    await waitFor(() => expect(mockSubmitSupportTicket).toHaveBeenCalled());

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(queryByText('support.successMessage')).toBeNull();
    expect(getByText('support.errorMessage')).toBeTruthy();
  });

  it('keeps the email support fallback that opens a mailto draft', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const { getByText } = await fillReadyTicket();

    fireEvent.press(getByText('support.emailInstead'));

    await waitFor(() => expect(Linking.openURL).toHaveBeenCalled());
    expect(mockSubmitSupportTicket).not.toHaveBeenCalled();
    expect((Linking.openURL as jest.Mock).mock.calls[0][0]).toContain('mailto:');
  });
});
