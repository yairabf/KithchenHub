import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { borderRadius, colors, spacing, typography } from '../../../theme';
import { premiumDemoApi } from '../services/premiumDemoApi';

interface PremiumDemoSectionProps {
  isPremium: boolean;
}

export function PremiumDemoSection({ isPremium }: PremiumDemoSectionProps) {
  const { t } = useTranslation('settings');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const fetchDemo = React.useCallback(async () => {
    if (!isPremium) {
      setMessage(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await premiumDemoApi.getDemo();
      setMessage(response.message);
    } catch {
      setError(t('premium.demoError'));
    } finally {
      setIsLoading(false);
    }
  }, [isPremium, t]);

  React.useEffect(() => {
    void fetchDemo();
  }, [fetchDemo]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('premium.demoTitle')}</Text>

      {!isPremium ? (
        <Text style={styles.lockedText}>{t('premium.demoLocked')}</Text>
      ) : null}

      {isPremium && isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : null}

      {isPremium && !isLoading && message ? (
        <Text style={styles.messageText}>{message}</Text>
      ) : null}

      {isPremium && !isLoading && error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {isPremium ? (
        <TouchableOpacity style={styles.refreshButton} onPress={() => void fetchDemo()}>
          <Text style={styles.refreshButtonText}>{t('premium.demoRefresh')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  title: {
    ...typography.labelBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lockedText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  messageText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  refreshButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  refreshButtonText: {
    ...typography.captionBold,
    color: colors.surface,
  },
});
