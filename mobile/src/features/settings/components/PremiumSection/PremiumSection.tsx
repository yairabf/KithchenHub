import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { borderRadius, colors, shadows, spacing, typography } from '../../../../theme';

interface PremiumSectionProps {
  subscription?: {
    planKey: string;
    status: string;
    entitlements: string[];
    trialEndsAt?: string | null;
    currentPeriodEndsAt?: string | null;
  };
}

function getPlanLabel(planKey: string | undefined, t: (key: string) => string) {
  if (planKey === 'premium') {
    return t('premium.planPremium');
  }

  return t('premium.planFree');
}

function getStatusLabel(status: string | undefined, t: (key: string) => string) {
  switch (status) {
    case 'active':
      return t('premium.statusActive');
    case 'trialing':
      return t('premium.statusTrialing');
    case 'past_due':
      return t('premium.statusPastDue');
    case 'canceled':
      return t('premium.statusCanceled');
    default:
      return t('premium.statusInactive');
  }
}

export function PremiumSection({ subscription }: PremiumSectionProps) {
  const { t } = useTranslation('settings');

  const featureKeys = [
    'premium.featureVoiceAdd',
    'premium.featureSmartMatching',
    'premium.featureRecipeImport',
  ] as const;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('premium.title')}</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{t('premium.cardTitle')}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {getPlanLabel(subscription?.planKey, t)}
            </Text>
          </View>
        </View>

        <Text style={styles.statusText}>
          {t('premium.statusLabel')}: {getStatusLabel(subscription?.status, t)}
        </Text>

        <Text style={styles.description}>{t('premium.description')}</Text>

        <View style={styles.featureList}>
          {featureKeys.map((key) => (
            <View key={key} style={styles.featureRow}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{t(key)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>{t('premium.comingSoon')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    ...typography.labelBold,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.pastel.yellow,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.captionBold,
    color: colors.secondary,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureBullet: {
    ...typography.label,
    color: colors.primary,
  },
  featureText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  footerNote: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.textSecondary,
  },
});
