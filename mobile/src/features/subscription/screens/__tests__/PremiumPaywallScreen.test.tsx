import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PremiumPaywallScreen } from '../PremiumPaywallScreen';

const mockGetOfferings = jest.fn();
const mockPurchasePackage = jest.fn();
const mockRestorePurchases = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'premium.paywallTitle': 'Premium',
        'premium.paywallHeadline': 'Upgrade your whole household',
        'premium.paywallDescription':
          'Start a 5-day free trial, then choose monthly or yearly billing.',
        'premium.householdScope': 'Premium applies to your whole household.',
        'premium.trialBadge': '5-day free trial',
        'premium.monthlyPlanTitle': 'Monthly plan',
        'premium.monthlyPlanDescription':
          'Flexible monthly billing through the App Store or Google Play.',
        'premium.yearlyPlanTitle': 'Yearly plan',
        'premium.yearlyPlanDescription':
          'Best value for households that want premium all year.',
        'premium.featureVoiceAdd': 'Voice grocery add',
        'premium.featureSmartMatching': 'Smart grocery matching',
        'premium.featureRecipeImport': 'AI recipe import',
        'premium.storeBillingNote':
          'Purchases will be handled through Apple App Store and Google Play.',
        'premium.purchaseComingSoon': 'Purchase and restore actions are coming soon.',
        'premium.startTrialCta': 'Start free trial',
        'premium.restorePurchasesCta': 'Restore purchases',
      }[key] ?? key),
  }),
}));

jest.mock('../../services/purchaseService', () => ({
  purchaseService: {
    isAvailable: jest.fn(() => true),
    getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
    purchasePackage: (...args: unknown[]) => mockPurchasePackage(...args),
    restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
  },
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
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('renders the premium paywall content for monthly, yearly, and trial messaging', () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Upgrade your whole household')).toBeTruthy();
    expect(getByText('5-day free trial')).toBeTruthy();
    expect(getByText('Monthly plan')).toBeTruthy();
    expect(getByText('Yearly plan')).toBeTruthy();
    expect(getByText('Voice grocery add')).toBeTruthy();
    expect(
      getByText('Purchases will be handled through Apple App Store and Google Play.'),
    ).toBeTruthy();
    expect(getByText('Start free trial')).toBeTruthy();
    expect(getByText('Restore purchases')).toBeTruthy();
  });

  it('starts trial purchase flow when pressing Start free trial', async () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    fireEvent.press(getByText('Start free trial'));

    await waitFor(() => {
      expect(mockPurchasePackage).toHaveBeenCalledWith('monthly');
    });
  });

  it('starts restore flow when pressing Restore purchases', async () => {
    const { getByText } = render(<PremiumPaywallScreen />);

    fireEvent.press(getByText('Restore purchases'));

    await waitFor(() => {
      expect(mockRestorePurchases).toHaveBeenCalledTimes(1);
    });
  });
});
