import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CenteredModal } from '../../../../common/components/CenteredModal/CenteredModal';
import { colors, spacing, typography } from '../../../../theme';

interface GuestDataImportModalProps {
  visible: boolean;
  onImport: () => void;
  onSkip: () => void;
}

/**
 * Modal component that prompts users to import existing guest session data
 * when signing in with Google after previously using guest mode.
 *
 * This modal appears automatically when:
 * - User is currently in guest mode
 * - User attempts to sign in with Google
 * - Guest data import prompt has not been shown before
 *
 * @component
 * @param {GuestDataImportModalProps} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {() => void} props.onImport - Callback when user chooses to import data
 * @param {() => void} props.onSkip - Callback when user chooses to skip import (also triggered by tapping outside modal)
 *
 * @example
 * ```tsx
 * <GuestDataImportModal
 *   visible={showPrompt}
 *   onImport={() => handleImport()}
 *   onSkip={() => handleSkip()}
 * />
 * ```
 */
export function GuestDataImportModal({
  visible,
  onImport,
  onSkip,
}: GuestDataImportModalProps) {
  const { t } = useTranslation('auth');

  return (
    <CenteredModal
      visible={visible}
      onClose={onSkip}
      title={t('guestDataImport.title')}
      confirmText={t('guestDataImport.importButton')}
      cancelText={t('guestDataImport.skipButton')}
      onConfirm={onImport}
      showActions={true}
      confirmColor={colors.primary}
    >
      <Text style={styles.bodyText}>{t('guestDataImport.body')}</Text>
    </CenteredModal>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
