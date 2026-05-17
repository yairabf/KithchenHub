import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PremiumPaywallScreen } from '../PremiumPaywallScreen';

const mockGetOfferings = jest.fn();
const mockPurchasePackage = jest.fn();
const mockRestorePurchases = jest.fn();
const mockReconcileCustomerState = jest.fn();
const mockRefreshUser = jest.fn();
const mockIsAvailable = jest.fn(() => true);
const mockOpenLegalUrl = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'premium.paywallTitle': 'Premium',
        'premium.paywallEyebrow': 'Household premium',
        'premium.paywallHeadline': 'Make the whole kitchen run smoother together.',
        'premium.paywallDescription':
          'This version sells the shared-home outcome first, then pricing second.',
        'premium.householdMembersLabel': 'Y M L A',
        'premium.householdCoverage': 'Covers everyone in your household',
        'premium.storyTitle': 'Why upgrade',
        'premium.storyVoiceTitle': 'Faster while cooking',
        'premium.storyVoiceDescription':
          'Voice add and lower-friction grocery capture reduce interruptions in the kitchen.',
        'premium.storyShoppingTitle': 'Smarter shared shopping',
        'premium.storyShoppingDescription':
          'Premium features help the whole household add and clean up items faster.',
        'premium.storyRecipeTitle': 'Less manual recipe work',
        'premium.storyRecipeDescription':
          'Import and turn recipe content into real grocery actions with fewer taps.',
        'premium.yearlyPlanTitle': 'Yearly plan',
        'premium.yearlyPlanBadge': 'Best value',
        'premium.yearlyPlanDescription':
          'Starts with a 5-day free trial. Best for families and couples already using KitchenHub every week.',
        'premium.monthlyPlanTitle': 'Monthly plan',
        'premium.monthlyPlanDescription':
          'A lighter commitment if you want to validate the premium workflow first.',
        'premium.monthlyPlanSecondaryDescription': 'Flexible monthly billing through the App Store or Google Play.',
        'premium.priceYearly': '$39.99 / year',
        'premium.priceMonthly': '$4.99 / month',
        'premium.storeBillingNote':
          'Subscription applies to your household premium status. Cancel anytime in your store settings.',
        'premium.subscriptionDisclosure':
          'Auto-renews unless canceled at least 24 hours before the end of the current period.',
        'premium.legalDisclosurePrefix': 'By subscribing, you agree to our terms and privacy policy:',
        'premium.privacyPolicyLink': 'Privacy Policy',
        'premium.termsOfUseLink': 'Terms of Use (EULA)',
        'premium.purchaseComingSoon': 'Purchase and restore actions are coming soon.',
        'premium.startTrialCta': 'Start household trial',
        'premium.restorePurchasesCta': 'Restore purchases',
        'premium.purchaseUnavailable':
          'Purchases are not configured on this app build. Please contact support.',
        'premium.alertTitle': 'Premium',
        'premium.purchaseSuccess': 'Purchase started successfully.',
        'premium.purchaseFailed':
          'Unable to start purchase right now. Please try again.',
        'premium.restoreSuccess': 'Restore completed successfully.',
        'premium.restoreFailed':
          'Unable to restore purchases right now. Please try again.',
      }[key] ?? key),
  }),
}));

jest.mock('../../services/purchaseService', () => ({
  purchaseService: {
    isAvailable: (...args: unknown[]) => mockIsAvailable(...args),
    getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
    purchasePackage: (...args: unknown[]) => mockPurchasePackage(...args),
    restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
  },
}));

jest.mock('../../services/subscriptionApi', () => ({
  subscriptionApi: {
    reconcileCustomerState: (...args: unknown[]) =>
      mockReconcileCustomerState(...args),
  },
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    refreshUser: (...args: unknown[]) => mockRefreshUser(...args),
  }),
}));

jest.mock('../../../../contexts/LegalLinksContext', () => ({
  useLegalLinks: () => ({
    privacyPolicyUrl: 'https://kithchensync1.vercel.app/privacy',
    termsOfServiceUrl: 'https://kithchensync1.vercel.app/terms',
  }),
}));

jest.mock('../../../../common/utils/legalLinks', () => ({
  openLegalUrl: (...args: unknown[]) => mockOpenLegalUrl(...args),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

jest.mock('../../../../common/components/ScreenHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ScreenHeader: ({ title }: { title: string }) => React.createElement(Text, null, title),
  };
});

describe('PremiumPaywallScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOfferings.mockResolvedValue(null);
    mockPurchasePackage.mockResolvedValue({
      provider: 'revenuecat',
      purchasedProductId: 'kitchenhub.monthly',
      customerState: {
        appUserId: 'household-user',
        originalAppUserId: 'household-user',
        activeEntitlementIds: ['premium'],
        activeSubscriptionProductIds: ['kitchenhub.monthly'],
        latestExpirationDate: '2026-06-01T00:00:00.000Z',
      },
    });
    mockRestorePurchases.mockResolvedValue({
      provider: 'revenuecat',
      restoredProductIds: ['kitchenhub.monthly'],
      customerState: {
        appUserId: 'household-user',
        originalAppUserId: 'household-user',
        activeEntitlementIds: ['premium'],
        activeSubscriptionProductIds: ['kitchenhub.monthly'],
        latestExpirationDate: '2026-06-01T00:00:00.000Z',
      },
    });
    mockReconcileCustomerState.mockResolvedValue({ accepted: true, reconciled: true });
    mockRefreshUser.mockResolvedValue(undefined);
    mockIsAvailable.mockReturnValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('renders the household-story premium paywall content', () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Household premium')).toBeTruthy();
    expect(getByText('Make the whole kitchen run smoother together.')).toBeTruthy();
    expect(getByText('Covers everyone in your household')).toBeTruthy();
    expect(getByText('Why upgrade')).toBeTruthy();
    expect(getByText('Faster while cooking')).toBeTruthy();
    expect(getByText('Smarter shared shopping')).toBeTruthy();
    expect(getByText('Less manual recipe work')).toBeTruthy();
    expect(getByText('Best value')).toBeTruthy();
    expect(getByText('Yearly plan')).toBeTruthy();
    expect(getByText('Monthly plan')).toBeTruthy();
    expect(
      getByText('Subscription applies to your household premium status. Cancel anytime in your store settings.'),
    ).toBeTruthy();
    expect(getByText('Auto-renews unless canceled at least 24 hours before the end of the current period.')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(getByText('Terms of Use (EULA)')).toBeTruthy();
    expect(getByText('Start household trial')).toBeTruthy();
    expect(getByText('Restore purchases')).toBeTruthy();
  });

  it('opens legal links from the subscription disclosure', () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    fireEvent.press(getByText('Privacy Policy'));
    fireEvent.press(getByText('Terms of Use (EULA)'));

    expect(mockOpenLegalUrl).toHaveBeenNthCalledWith(1, 'https://kithchensync1.vercel.app/privacy');
    expect(mockOpenLegalUrl).toHaveBeenNthCalledWith(2, 'https://kithchensync1.vercel.app/terms');
  });

  it('starts trial purchase flow when pressing Start household trial', async () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    fireEvent.press(getByText('Start household trial'));

    await waitFor(() => {
      expect(mockPurchasePackage).toHaveBeenCalledWith('monthly');
    });

    expect(mockReconcileCustomerState).toHaveBeenCalledWith('revenuecat', {
      appUserId: 'household-user',
      originalAppUserId: 'household-user',
      activeEntitlementIds: ['premium'],
      activeSubscriptionProductIds: ['kitchenhub.monthly'],
      latestExpirationDate: '2026-06-01T00:00:00.000Z',
    });
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });

  it('shows an explicit alert when purchases are unavailable for this build', async () => {
    mockIsAvailable.mockReturnValue(false);

    const { getByText } = render(<PremiumPaywallScreen />);

    fireEvent.press(getByText('Start household trial'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Premium',
        'Purchases are not configured on this app build. Please contact support.',
      );
    });

    expect(mockPurchasePackage).not.toHaveBeenCalled();
    expect(mockReconcileCustomerState).not.toHaveBeenCalled();
  });

  it('starts restore flow when pressing Restore purchases', async () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    fireEvent.press(getByText('Restore purchases'));

    await waitFor(() => {
      expect(mockRestorePurchases).toHaveBeenCalledTimes(1);
    });

    expect(mockReconcileCustomerState).toHaveBeenCalledWith('revenuecat', {
      appUserId: 'household-user',
      originalAppUserId: 'household-user',
      activeEntitlementIds: ['premium'],
      activeSubscriptionProductIds: ['kitchenhub.monthly'],
      latestExpirationDate: '2026-06-01T00:00:00.000Z',
    });
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });
});
