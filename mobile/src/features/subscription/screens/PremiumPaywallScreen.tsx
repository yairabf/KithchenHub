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

const HOUSEHOLD_MEMBER_KEYS = [
  'premium.householdMemberOne',
  'premium.householdMemberTwo',
  'premium.householdMemberThree',
  'premium.householdMemberFour',
] as const;

const STORY_KEYS = [
  {
    icon: '🎙',
    title: 'premium.storyVoiceTitle',
    description: 'premium.storyVoiceDescription',
  },
  {
    icon: '🛒',
    title: 'premium.storyShoppingTitle',
    description: 'premium.storyShoppingDescription',
  },
  {
    icon: '📖',
    title: 'premium.storyRecipeTitle',
    description: 'premium.storyRecipeDescription',
  },
] as const;

const PLAN_KEYS = [
  {
    title: 'premium.yearlyPlanTitle',
    description: 'premium.yearlyPlanDescription',
    price: 'premium.priceYearly',
    badge: 'premium.yearlyPlanBadge',
    featured: true,
  },
  {
    title: 'premium.monthlyPlanTitle',
    description: 'premium.monthlyPlanDescription',
    price: 'premium.priceMonthly',
    badge: undefined,
    featured: false,
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
          <View style={styles.eyebrowBadge}>
            <Text style={styles.eyebrowBadgeText}>{t('premium.paywallEyebrow')}</Text>
          </View>
          <Text style={styles.heroHeadline}>{t('premium.paywallHeadline')}</Text>
          <Text style={styles.heroDescription}>
            {t('premium.paywallDescription')}
          </Text>

          <View style={styles.householdRow}>
            <View style={styles.householdMembersRow}>
              {HOUSEHOLD_MEMBER_KEYS.map((memberKey, index) => (
                <View
                  key={memberKey}
                  style={[
                    styles.householdMemberBadge,
                    index > 0 ? styles.householdMemberBadgeOverlap : null,
                  ]}
                >
                  <Text style={styles.householdMemberBadgeText}>{t(memberKey)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.householdCoverageText}>
              {t('premium.householdCoverage')}
            </Text>
          </View>
        </View>

        <View style={styles.storyCard}>
          <Text style={styles.sectionEyebrow}>{t('premium.storyTitle')}</Text>
          <View style={styles.storyList}>
            {STORY_KEYS.map((storyItem) => (
              <View key={storyItem.title} style={styles.storyItemCard}>
                <View style={styles.storyIconBadge}>
                  <Text style={styles.storyIconText}>{storyItem.icon}</Text>
                </View>
                <View style={styles.storyCopy}>
                  <Text style={styles.storyItemTitle}>{t(storyItem.title)}</Text>
                  <Text style={styles.storyItemDescription}>
                    {t(storyItem.description)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {PLAN_KEYS.map((plan) => (
            <View
              key={plan.title}
              style={[styles.planCard, plan.featured ? styles.planCardFeatured : null]}
            >
              <View style={styles.planHeaderRow}>
                <Text style={styles.planTitle}>{t(plan.title)}</Text>
                {plan.badge ? (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{t(plan.badge)}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.planPrice}>{t(plan.price)}</Text>
              <Text style={styles.planDescription}>{t(plan.description)}</Text>
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
  eyebrowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pastel.green,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  eyebrowBadgeText: {
    ...typography.captionBold,
    color: colors.primaryDark,
  },
  heroHeadline: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  householdMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  householdMemberBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  householdMemberBadgeOverlap: {
    marginLeft: -8,
  },
  householdMemberBadgeText: {
    ...typography.labelBold,
    color: colors.surface,
  },
  householdCoverageText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.primaryDark,
  },
  storyCard: {
    backgroundColor: colors.transparent.white70,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.transparent.white80,
  },
  sectionEyebrow: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  storyList: {
    gap: spacing.md,
  },
  storyItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.pastel.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyIconText: {
    fontSize: 18,
  },
  storyCopy: {
    flex: 1,
  },
  storyItemTitle: {
    ...typography.labelBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  storyItemDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planCardFeatured: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.pastel.green,
    ...shadows.sm,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  planTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  planBadge: {
    backgroundColor: colors.transparent.white80,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  planBadgeText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  planPrice: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
