import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Switch, TextInput } from 'react-native';

import { SupportTicketScreen } from '../SupportTicketScreen';

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

describe('SupportTicketScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the draft and shows an error when no email app can open the support ticket', async () => {
    const { UNSAFE_getAllByType, UNSAFE_getByType, getByText, queryByText } = render(<SupportTicketScreen />);

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

    fireEvent.press(getByText('support.submitTicket'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('support.emailUnavailableTitle', 'support.emailUnavailableMessage');
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(queryByText('support.successMessage')).toBeNull();
    expect(getByText('support.errorMessage')).toBeTruthy();
  });
});
