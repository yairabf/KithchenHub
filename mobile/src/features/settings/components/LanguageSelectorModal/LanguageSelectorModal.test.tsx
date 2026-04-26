import React from 'react';
import { Alert, Text, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageSelectorModal } from './LanguageSelectorModal';

const mockSetAppLanguage = jest.fn();

jest.mock('../../../../common/components/CenteredModal', () => ({
  CenteredModal: ({ visible, title, children }: { visible: boolean; title: string; children: React.ReactNode }) => {
    const React = require('react');
    const { View, Text } = require('react-native');

    if (!visible) {
      return null;
    }

    return React.createElement(
      View,
      null,
      React.createElement(Text, null, title),
      children,
    );
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        language: 'Language',
        languageSaveErrorTitle: 'Unable to save language',
        languageSaveErrorMessage: 'Your language changed for now, but it could not be saved for next launch.',
      }[key] ?? key),
  }),
}));

jest.mock('../../../../i18n', () => ({
  setAppLanguage: (...args: unknown[]) => mockSetAppLanguage(...args),
}));

describe('LanguageSelectorModal', () => {
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockImplementation(() => {});
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('shows an error and does not close when saving the selected language fails', async () => {
    const onClose = jest.fn();
    mockSetAppLanguage.mockRejectedValueOnce(new Error('storage unavailable'));

    const { getByText } = render(
      <LanguageSelectorModal visible onClose={onClose} currentLanguageCode="en" />,
    );

    fireEvent.press(getByText('עברית'));

    await waitFor(() => {
      expect(mockSetAppLanguage).toHaveBeenCalledWith('he');
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Unable to save language',
        'Your language changed for now, but it could not be saved for next launch.',
      );
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
