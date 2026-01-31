import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { AVAILABLE_LANGUAGES } from '../../../../i18n/constants';
import { setAppLanguage } from '../../../../i18n';
import { isRtlLanguage } from '../../../../i18n/rtl';
import { colors, spacing, borderRadius, typography } from '../../../../theme';
import type { LanguageSelectorModalProps } from './types';

const MIN_ROW_HEIGHT = 44;

/**
 * Modal that lists available languages with native names and a checkmark for the current one.
 * On selection: persists to AsyncStorage via setAppLanguage and closes; app re-renders via i18n.
 */
export function LanguageSelectorModal({
  visible,
  onClose,
  currentLanguageCode,
}: LanguageSelectorModalProps) {
  const { t } = useTranslation('settings');

  const handleSelectLanguage = async (code: string) => {
    try {
      await setAppLanguage(code);
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('language')}
      showActions={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {AVAILABLE_LANGUAGES.map((entry) => {
          const isSelected = entry.code === currentLanguageCode;
          const currentIsRtl = isRtlLanguage(currentLanguageCode);
          const entryIsRtl = isRtlLanguage(entry.code);
          const showRestartBadge = currentIsRtl !== entryIsRtl;
          const label = `${t('language')}: ${entry.nativeName}`;
          return (
            <TouchableOpacity
              key={entry.code}
              style={[styles.row, { minHeight: MIN_ROW_HEIGHT }]}
              onPress={() => handleSelectLanguage(entry.code)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.rowContent}>
                <View style={styles.labelBlock}>
                  <Text style={styles.nativeName}>{entry.nativeName}</Text>
                  {showRestartBadge ? (
                    <Text style={styles.restartBadge}>{t('restartRequired')}</Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </CenteredModal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 320,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  labelBlock: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  nativeName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  restartBadge: {
    ...typography.tinyMuted,
  },
});
