import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ImportService } from '../../../services/import/importService';
import { useAuth } from '../../../contexts/AuthContext';
import { colors } from '../../../theme';

interface ImportDataModalProps {
    visible: boolean;
    onClose: () => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ImportDataModal({ visible, onClose }: ImportDataModalProps) {
    const { clearGuestData } = useAuth();
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (visible && status === 'idle') {
            startImport();
        } else if (!visible) {
            // Reset state when closed
            setStatus('idle');
            setErrorMessage('');
        }
    }, [visible]);

    const startImport = async () => {
        setStatus('loading');
        setErrorMessage('');

        try {
            const payload = await ImportService.gatherLocalData();
            await ImportService.submitImport(payload);
            setStatus('success');
        } catch (error) {
            console.error('Import failed', error);
            setStatus('error');
            const msg = error instanceof Error ? error.message : 'Failed to import data';
            setErrorMessage(msg);
        }
    };

    const handleClose = () => {
        if (status === 'loading') return; // Prevent closing while loading
        onClose();
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear Local Data?',
            'This will remove all guest data from this device. This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearGuestData();
                            // Optional: Show a quick toast or just close
                            onClose();
                        } catch (error) {
                            console.error('Failed to clear data', error);
                            Alert.alert('Error', 'Failed to clear local data.');
                        }
                    },
                },
            ]
        );
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <View style={styles.content}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.text}>Importing your recipes, lists, and chores...</Text>
                        <Text style={styles.subtext}>This may take a few moments.</Text>
                    </View>
                );
            case 'success':
                return (
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle" size={60} color={colors.success} />
                        </View>
                        <Text style={styles.title}>Success!</Text>
                        <Text style={styles.text}>Your data has been successfully imported to your account.</Text>

                        <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
                            <Text style={styles.clearText}>Clear local data</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                            <Text style={styles.secondaryText}>Keep & Close</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'error':
                return (
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="alert-circle" size={60} color={colors.error} />
                        </View>
                        <Text style={styles.title}>Import Failed</Text>
                        <Text style={styles.text}>{errorMessage}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={startImport}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <CenteredModal
            visible={visible}
            onClose={handleClose}
            title={status === 'success' ? 'Import Complete' : 'Import Data'}
            showActions={false}
        >
            {renderContent()}
        </CenteredModal>
    );
}

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: colors.textPrimary,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    subtext: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    clearButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: colors.error, // or a cautionary color
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    clearText: {
        color: '#fff',
        fontWeight: '600',
    },
    secondaryButton: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    secondaryText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
