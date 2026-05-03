import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../../../theme';
import type { PremiumStatusSummary } from '../../../auth/services/authApi';

interface PremiumSectionProps {
  premium?: PremiumStatusSummary;
  onOpenPaywall?: () => void;
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function getPlanLabel(
  premium: PremiumStatusSummary | undefined,
  t: (key: string) => string,
): string {
  return premium?.isPremium ? t('premium.planPremium') : t('premium.planFree');
}

function getStatusLabel(
  status: string | undefined,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'active':
      return t('premium.statusActive');
    case 'trialing':
      return t('premium.statusTrialing');
    case 'canceled':
      return t('premium.statusCanceled');
    case 'past_due':
      return t('premium.statusPastDue');
    default:
      return t('premium.statusInactive');
  }
}

function getDateLabel(
  premium: PremiumStatusSummary | undefined,
  t: (key: string) => string,
): string | null {
  if (premium?.status === 'trialing' && premium.trialEndsAt) {
    return `${t('premium.trialEndsLabel')}: ${formatDate(premium.trialEndsAt)}`;
  }

  if (premium?.currentPeriodEndsAt) {
    const translationKey = premium.isPremium
      ? 'premium.renewsLabel'
      : 'premium.expiresLabel';

    return `${t(translationKey)}: ${formatDate(premium.currentPeriodEndsAt)}`;
  }

  return null;
}

export function PremiumSection({
  premium,
  onOpenPaywall,
}: PremiumSectionProps) {
  const { t } = useTranslation('settings');
  const dateLabel = getDateLabel(premium, t);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('premium.title')}</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{t('premium.cardTitle')}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getPlanLabel(premium, t)}</Text>
          </View>
        </View>

        <Text style={styles.statusText}>
          {t('premium.statusLabel')}: {getStatusLabel(premium?.status, t)}
        </Text>

        {dateLabel ? <Text style={styles.metaText}>{dateLabel}</Text> : null}

        <Text style={styles.description}>{t('premium.householdScope')}</Text>
        <Text style={styles.footerNote}>{t('premium.comingSoon')}</Text>

        {onOpenPaywall ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onOpenPaywall}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>{t('premium.viewPlans')}</Text>
          </TouchableOpacity>
        ) : null}
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
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    ...typography.labelBold,
    color: colors.surface,
  },
});
