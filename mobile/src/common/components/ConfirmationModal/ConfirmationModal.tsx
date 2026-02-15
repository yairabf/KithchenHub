import React from 'react';
import { View, Text } from 'react-native';
import { CenteredModal } from '../CenteredModal';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { ConfirmationModalProps } from './types';

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = colors.error,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <CenteredModal
      visible={visible}
      onClose={onCancel}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmColor={confirmColor}
      onConfirm={onConfirm}
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </CenteredModal>
  );
}
