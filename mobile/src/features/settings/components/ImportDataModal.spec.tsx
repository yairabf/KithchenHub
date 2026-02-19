import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImportDataModal } from './ImportDataModal';
import { ImportService } from '../../../services/import/importService';
import { Alert, AlertButton } from 'react-native';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', dir: () => 'ltr' },
    }),
}));

jest.mock('../../../services/import/importService', () => ({
    ImportService: {
        gatherLocalData: jest.fn(),
        submitImport: jest.fn(),
    },
}));

const mockClearGuestData = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        clearGuestData: mockClearGuestData,
    }),
}));

describe('ImportDataModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default success mock behavior
        (ImportService.gatherLocalData as jest.Mock).mockResolvedValue({});
        (ImportService.submitImport as jest.Mock).mockResolvedValue({});
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

    it('renders and starts import automatically when visible', async () => {
        const onClose = jest.fn();
        const { getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        expect(getByText('importData.loading')).toBeTruthy();
        expect(ImportService.gatherLocalData).toHaveBeenCalled();
        await waitFor(() => {
            expect(ImportService.submitImport).toHaveBeenCalled();
        });
    });

    it('shows success state and clear button on successful import', async () => {
        const onClose = jest.fn();
        const { getByText, findByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        const successTitle = await findByText('importData.successTitle');
        expect(successTitle).toBeTruthy();
        expect(getByText('importData.clearDataButton')).toBeTruthy();
        expect(getByText('importData.keepCloseButton')).toBeTruthy();
    });

    it('triggers confirmation alert when clear data button is pressed', async () => {
        const onClose = jest.fn();
        const { findByText, getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        await findByText('importData.successTitle');
        fireEvent.press(getByText('importData.clearDataButton'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'importData.clearDataAlert.title',
            'importData.clearDataAlert.message',
            expect.any(Array)
        );
    });

    it('calls clearGuestData when confirmation is accepted', async () => {
        const onClose = jest.fn();
        const { findByText, getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        await findByText('importData.successTitle');
        fireEvent.press(getByText('importData.clearDataButton'));

        const alertSpy = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
        const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
        const confirmButton = buttons.find(b => b.text === 'importData.clearDataAlert.confirm');

        await confirmButton?.onPress?.();

        expect(mockClearGuestData).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('does not call clearGuestData when cancelled', async () => {
        const onClose = jest.fn();
        const { findByText, getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        await findByText('importData.successTitle');
        fireEvent.press(getByText('importData.clearDataButton'));

        const alertSpy = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
        const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
        const cancelButton = buttons.find(b => b.text === 'importData.clearDataAlert.cancel');

        cancelButton?.onPress?.();

        expect(mockClearGuestData).not.toHaveBeenCalled();
    });
});
