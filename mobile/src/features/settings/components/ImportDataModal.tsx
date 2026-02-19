import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ImportService } from '../../../services/import/importService';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../../theme';

interface ImportDataModalProps {
  visible: boolean;
  onClose: () => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ImportDataModal({ visible, onClose }: ImportDataModalProps) {
  const { t } = useTranslation('settings');
  const { clearGuestData } = useAuth();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const startImport = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const payload = await ImportService.gatherLocalData();
      await ImportService.submitImport(payload);
      setStatus('success');
    } catch (error) {
      console.error('Import failed', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('importData.errorTitle'));
    }
  }, [t]);

  useEffect(() => {
    if (visible && status === 'idle') {
      startImport();
    } else if (!visible) {
      setStatus('idle');
      setErrorMessage('');
    }
  }, [visible, status, startImport]);

  const handleClose = () => {
    if (status === 'loading') return;
    onClose();
  };

  const handleClearData = () => {
    Alert.alert(
      t('importData.clearDataAlert.title'),
      t('importData.clearDataAlert.message'),
      [
        {
          text: t('importData.clearDataAlert.cancel'),
          style: 'cancel',
        },
        {
          text: t('importData.clearDataAlert.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearGuestData();
              onClose();
            } catch (error) {
              console.error('Failed to clear data', error);
              Alert.alert(
                t('importData.clearDataAlert.errorTitle'),
                t('importData.clearDataAlert.errorMessage'),
              );
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
            <Text style={styles.text}>{t('importData.loading')}</Text>
            <Text style={styles.subtext}>{t('importData.loadingHint')}</Text>
          </View>
        );
      case 'success':
        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={60} color={colors.success} />
            </View>
            <Text style={styles.title}>{t('importData.successTitle')}</Text>
            <Text style={styles.text}>{t('importData.successBody')}</Text>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
              <Text style={styles.clearText}>{t('importData.clearDataButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
              <Text style={styles.secondaryText}>{t('importData.keepCloseButton')}</Text>
            </TouchableOpacity>
          </View>
        );
      case 'error':
        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={60} color={colors.error} />
            </View>
            <Text style={styles.title}>{t('importData.errorTitle')}</Text>
            <Text style={styles.text}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={startImport}>
              <Text style={styles.retryText}>{t('importData.retryButton')}</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const modalTitle = status === 'success'
    ? t('importData.titleSuccess')
    : t('importData.title');

  return (
    <CenteredModal
      visible={visible}
      onClose={handleClose}
      title={modalTitle}
      showActions={false}
    >
      {renderContent()}
    </CenteredModal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  subtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  clearButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  clearText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
