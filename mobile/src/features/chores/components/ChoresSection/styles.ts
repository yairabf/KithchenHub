import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, typography } from '../../../../theme';

export const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    ...(Platform.OS === 'ios' && { paddingTop: spacing.xs }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    // iOS needs minimal top spacing due to text rendering differences
    ...(Platform.OS === 'ios' && { marginTop: spacing.xs }),
  },
  sectionIndicator: {
    width: 4,
    height: 25,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionIndicatorAlt: {
    backgroundColor: colors.secondary,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    fontSize: 18,
    fontWeight: '800',
    // Override inherited lineHeight (14) which clips 18px font on iOS
    // Ratio of ~1.33x (24/18) provides proper vertical spacing
    lineHeight: 24,
    color: colors.textPrimary,
  },
  sectionTitleRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  choreList: {
    gap: spacing.sm,
  },
});
