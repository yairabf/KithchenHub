import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import type { MainStackParamList } from '../../../navigation/types';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { purchaseService } from '../services/purchaseService';
import { subscriptionApi } from '../services/subscriptionApi';

const FEATURE_KEYS = [
  'premium.featureVoiceAdd',
  'premium.featureSmartMatching',
  'premium.featureRecipeImport',
] as const;

const PLAN_KEYS = [
  {
    title: 'premium.monthlyPlanTitle',
    description: 'premium.monthlyPlanDescription',
  },
  {
    title: 'premium.yearlyPlanTitle',
    description: 'premium.yearlyPlanDescription',
  },
] as const;

export function PremiumPaywallScreen() {
  const { t } = useTranslation('settings');
  const { refreshUser } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [defaultPackageId, setDefaultPackageId] = useState<string>('monthly');

  const purchaseUnavailable = useMemo(() => !purchaseService.isAvailable(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadOfferings() {
      if (purchaseUnavailable) {
        return;
      }

      try {
        const offerings = await purchaseService.getOfferings();
        if (!isMounted || !offerings || offerings.packages.length === 0) {
          return;
        }

        const monthlyPackage = offerings.packages.find(
          (pkg) => pkg.period === 'monthly',
        );

        setDefaultPackageId(monthlyPackage?.id ?? offerings.packages[0].id);
      } catch {
        // Keep default monthly fallback; UI remains usable.
      }
    }

    loadOfferings();

    return () => {
      isMounted = false;
    };
  }, [purchaseUnavailable]);

  const handleStartTrial = async () => {
    if (purchaseUnavailable) {
      Alert.alert(
        t('premium.alertTitle'),
        t('premium.purchaseUnavailable'),
      );
      return;
    }

    if (isPurchasing || isRestoring) {
      return;
    }

    try {
      setIsPurchasing(true);
      const purchaseResult = await purchaseService.purchasePackage(defaultPackageId);
      await subscriptionApi.reconcileCustomerState(
        purchaseResult.provider,
        purchaseResult.customerState,
      );
      await refreshUser();
      Alert.alert(
        t('premium.alertTitle'),
        t('premium.purchaseSuccess'),
      );
    } catch {
      Alert.alert(
        t('premium.alertTitle'),
        t('premium.purchaseFailed'),
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (purchaseUnavailable) {
      Alert.alert(
        t('premium.alertTitle'),
        t('premium.purchaseUnavailable'),
      );
      return;
    }

    if (isPurchasing || isRestoring) {
      return;
    }

    try {
      setIsRestoring(true);
      const restoreResult = await purchaseService.restorePurchases();
      await subscriptionApi.reconcileCustomerState(
        restoreResult.provider,
        restoreResult.customerState,
      );
      await refreshUser();
      Alert.alert(
        t('premium.alertTitle'),
        t('premium.restoreSuccess'),
      );
    } catch {
      Alert.alert(
        t('premium.alertTitle'),
        t('premium.restoreFailed'),
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('premium.paywallTitle')}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        variant="centered"
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroHeadline}>{t('premium.paywallHeadline')}</Text>
          <Text style={styles.heroDescription}>
            {t('premium.paywallDescription')}
          </Text>
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>{t('premium.trialBadge')}</Text>
          </View>
          <Text style={styles.householdText}>{t('premium.householdScope')}</Text>
        </View>

        <View style={styles.section}>
          {PLAN_KEYS.map((plan) => (
            <View key={plan.title} style={styles.planCard}>
              <Text style={styles.planTitle}>{t(plan.title)}</Text>
              <Text style={styles.planDescription}>{t(plan.description)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          {FEATURE_KEYS.map((featureKey) => (
            <View key={featureKey} style={styles.featureRow}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{t(featureKey)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>{t('premium.storeBillingNote')}</Text>
          <Text style={styles.infoSubtext}>{t('premium.purchaseComingSoon')}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleStartTrial}
          disabled={isPurchasing || isRestoring}
        >
          <Text style={styles.primaryButtonText}>{t('premium.startTrialCta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={handleRestorePurchases}
          disabled={isPurchasing || isRestoring}
        >
          <Text style={styles.secondaryButtonText}>
            {t('premium.restorePurchasesCta')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  heroHeadline: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  trialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pastel.yellow,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  trialBadgeText: {
    ...typography.captionBold,
    color: colors.secondary,
  },
  householdText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planTitle: {
    ...typography.labelBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureBullet: {
    ...typography.labelBold,
    color: colors.primary,
  },
  featureText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.labelBold,
    color: colors.surface,
  },
  secondaryButton: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    ...typography.labelBold,
    color: colors.textPrimary,
  },
});
