import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { CenteredModal } from '../../../common/components/CenteredModal/CenteredModal';
import { colors, spacing, typography } from '../../../theme';

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
  return (
    <CenteredModal
      visible={visible}
      onClose={onSkip}
      title="Found existing data"
      confirmText="Import local data"
      cancelText="Not now"
      onConfirm={onImport}
      showActions={true}
      confirmColor={colors.primary}
    >
      <Text style={styles.bodyText}>
        We found recipes or plans from your guest session. Would you like to import them to your account?
      </Text>
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
