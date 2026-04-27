import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { FormPresentationModalProps } from './types';

export function FormPresentationModal({
  visible,
  onClose,
  onSubmit,
  title,
  children,
  cancelText,
  submitText,
  submitDisabled = false,
  submitLoading = false,
  submitColor = colors.primary,
  presentation = 'fullScreen',
  showFooter = false,
}: FormPresentationModalProps) {
  const { t } = useTranslation('common');

  if (!visible) return null;

  const resolvedCancelText = cancelText ?? t('buttons.cancel');
  const resolvedSubmitText = submitText ?? t('buttons.confirm');
  const isSubmitDisabled = submitDisabled || submitLoading;
  const shellStyle = presentation === 'sheet' ? styles.sheetShell : styles.fullScreenShell;
  const panelStyle = presentation === 'sheet' ? styles.sheetPanel : styles.fullScreenShell;

  const headerSubmit = !showFooter && onSubmit;
  const footerSubmit = showFooter && onSubmit;

  return (
    <Modal
      visible={visible}
      transparent={presentation === 'sheet'}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        {presentation === 'sheet' ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        ) : null}

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={shellStyle}>
            <View style={panelStyle}>
              {presentation === 'sheet' ? (
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
              ) : null}

              <SafeAreaView style={styles.safeArea} edges={presentation === 'sheet' ? ['bottom'] : ['top', 'bottom']}>
                <View style={styles.header}>
                  <View style={styles.headerSide}>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      accessibilityRole="button"
                      accessibilityLabel={resolvedCancelText}
                    >
                      <Text style={styles.closeButtonText}>{resolvedCancelText}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.title} numberOfLines={1}>
                    {title}
                  </Text>

                  <View style={[styles.headerSide, styles.headerSideEnd]}>
                    {headerSubmit ? (
                      <TouchableOpacity
                        onPress={onSubmit}
                        disabled={isSubmitDisabled}
                        style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
                        accessibilityRole="button"
                        accessibilityLabel={resolvedSubmitText}
                      >
                        {submitLoading ? (
                          <ActivityIndicator size="small" color={submitColor} />
                        ) : (
                          <Text style={[styles.submitButtonText, { color: submitColor }]}>{resolvedSubmitText}</Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.body}>{children}</View>

                {footerSubmit ? (
                  <View style={styles.footer}>
                    <TouchableOpacity
                      style={[styles.footerButton, styles.cancelFooterButton]}
                      onPress={onClose}
                    >
                      <Text style={styles.cancelFooterText}>{resolvedCancelText}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.footerButton,
                        styles.submitFooterButton,
                        { backgroundColor: submitColor },
                        isSubmitDisabled && styles.submitFooterButtonDisabled,
                      ]}
                      onPress={onSubmit}
                      disabled={isSubmitDisabled}
                    >
                      {submitLoading ? (
                        <ActivityIndicator size="small" color={colors.textLight} />
                      ) : (
                        <Text style={styles.submitFooterText}>{resolvedSubmitText}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </SafeAreaView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
