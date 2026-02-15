import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';

/**
 * Props for the first-launch legal consent modal.
 *
 * @property visible - When true, the modal is shown; when false, nothing is rendered.
 * @property onAccept - Callback when the user taps "Accept & Continue". The caller should persist consent (e.g. AsyncStorage) and then hide the modal.
 * @property onOpenPrivacyPolicy - Callback to open the privacy policy URL (e.g. in browser). Called when the user taps "View Privacy Policy".
 * @property onOpenTerms - Callback to open the terms of service URL. Called when the user taps "View Terms".
 */
export interface LegalConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms: () => void;
}

/**
 * First-launch legal consent modal. Not dismissible by backdrop or close button;
 * user must tap "Accept & Continue" to proceed.
 */
export function LegalConsentModal({
  visible,
  onAccept,
  onOpenPrivacyPolicy,
  onOpenTerms,
}: LegalConsentModalProps) {
  const { t } = useTranslation('legal');

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={styles.modalContent}>
          <Text style={styles.message}>{t('consentMessage')}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.linkButton}
              onPress={onOpenPrivacyPolicy}
              accessibilityRole="link"
              accessibilityLabel={t('viewPrivacyPolicy')}
              accessibilityHint={t('opensInBrowser')}
            >
              <Text style={styles.linkButtonText}>{t('viewPrivacyPolicy')}</Text>
            </Pressable>
            <Pressable
              style={styles.linkButton}
              onPress={onOpenTerms}
              accessibilityRole="link"
              accessibilityLabel={t('viewTerms')}
              accessibilityHint={t('opensInBrowser')}
            >
              <Text style={styles.linkButtonText}>{t('viewTerms')}</Text>
            </Pressable>
            <Pressable
              style={styles.acceptButton}
              onPress={onAccept}
              accessibilityRole="button"
              accessibilityLabel={t('acceptContinue')}
            >
              <Text style={styles.acceptButtonText}>{t('acceptContinue')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
