import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImportDataModal } from './ImportDataModal';
import { ImportService } from '../../../services/import/importService';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
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
        jest.spyOn(Alert, 'alert');
    });

    it('renders and starts import automatically when visible', async () => {
        const onClose = jest.fn();
        const { getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        // Should start loading
        expect(getByText('Importing your recipes, lists, and chores...')).toBeTruthy();
        expect(ImportService.gatherLocalData).toHaveBeenCalled();
    });

    it('shows success state and clear button on successful import', async () => {
        const onClose = jest.fn();
        const { getByText, findByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        // Wait for success
        const successTitle = await findByText('Success!');
        expect(successTitle).toBeTruthy();
        expect(getByText('Clear local data')).toBeTruthy();
        expect(getByText('Keep & Close')).toBeTruthy();
    });

    it('triggers confirmation alert when Clear local data is pressed', async () => {
        const onClose = jest.fn();
        const { findByText, getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        await findByText('Success!');
        fireEvent.press(getByText('Clear local data'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Clear Local Data?',
            expect.stringContaining('This will remove all guest data'),
            expect.any(Array)
        );
    });

    it('calls clearGuestData when confirmation is accepted', async () => {
        const onClose = jest.fn();
        const { findByText, getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        await findByText('Success!');
        fireEvent.press(getByText('Clear local data'));

        // Mock the Alert button press
        // @ts-ignore
        const alertCalls = (Alert.alert as jest.Mock).mock.calls;
        const buttons = alertCalls[0][2];
        const clearButton = buttons.find((b: any) => b.text === 'Clear');

        // Execute the onPress of the "Clear" button
        await clearButton.onPress();

        expect(mockClearGuestData).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('does not call clearGuestData when cancelled', async () => {
        const onClose = jest.fn();
        const { findByText, getByText } = render(<ImportDataModal visible={true} onClose={onClose} />);

        await findByText('Success!');
        fireEvent.press(getByText('Clear local data'));

        // @ts-ignore
        const alertCalls = (Alert.alert as jest.Mock).mock.calls;
        const buttons = alertCalls[0][2];
        const cancelButton = buttons.find((b: any) => b.text === 'Cancel');

        // Execute cancel (usually just closes alert, in our mock we do nothing or just ensure no callback)
        if (cancelButton.onPress) {
            cancelButton.onPress();
        }

        expect(mockClearGuestData).not.toHaveBeenCalled();
    });
});
