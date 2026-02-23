import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CenteredModal } from '../CenteredModal';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { ConfirmationModalProps } from './types';

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  confirmColor = colors.error,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const { t } = useTranslation('common');
  const resolvedConfirmText = confirmText ?? t('buttons.confirm');
  const resolvedCancelText = cancelText ?? t('buttons.cancel');

  return (
    <CenteredModal
      visible={visible}
      onClose={onCancel}
      title={title}
      confirmText={resolvedConfirmText}
      cancelText={resolvedCancelText}
      confirmColor={confirmColor}
      onConfirm={onConfirm}
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </CenteredModal>
  );
}
