import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ImportService } from '../../../services/import/importService';
import { colors } from '../../../theme';

interface ImportDataModalProps {
    visible: boolean;
    onClose: () => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ImportDataModal({ visible, onClose }: ImportDataModalProps) {
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
        } catch (error: any) {
            console.error('Import failed', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to import data');
        }
    };

    const handleClose = () => {
        if (status === 'loading') return; // Prevent closing while loading
        onClose();
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
                        <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                            <Text style={styles.doneText}>Done</Text>
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
    doneButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: colors.success,
        borderRadius: 8,
    },
    doneText: {
        color: '#fff',
        fontWeight: '600',
    },
});
