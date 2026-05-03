import React from 'react';
import { render } from '@testing-library/react-native';
import { PremiumSection } from './PremiumSection';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'premium.title': 'Premium',
        'premium.cardTitle': 'KitchenHub Premium',
        'premium.planFree': 'Free',
        'premium.planPremium': 'Premium',
        'premium.statusLabel': 'Status',
        'premium.statusInactive': 'Inactive',
        'premium.statusActive': 'Active',
        'premium.statusTrialing': 'Trialing',
        'premium.statusCanceled': 'Canceled',
        'premium.statusPastDue': 'Past due',
        'premium.householdScope': 'Premium applies to your whole household.',
        'premium.trialEndsLabel': 'Trial ends',
        'premium.renewsLabel': 'Renews on',
        'premium.expiresLabel': 'Access until',
        'premium.comingSoon': 'Billing, upgrades, and restore controls are coming soon.',
      }[key] ?? key),
  }),
}));

describe('PremiumSection', () => {
  it('renders a free inactive state by default', () => {
    const { getByText } = render(<PremiumSection />);

    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Free')).toBeTruthy();
    expect(getByText('Status: Inactive')).toBeTruthy();
    expect(getByText('Premium applies to your whole household.')).toBeTruthy();
    expect(
      getByText('Billing, upgrades, and restore controls are coming soon.'),
    ).toBeTruthy();
  });

  it('renders a premium trial state with trial end date', () => {
    const { getAllByText, getByText } = render(
      <PremiumSection
        premium={{
          isPremium: true,
          status: 'trialing',
          trialEndsAt: '2026-05-08T00:00:00.000Z',
          currentPeriodEndsAt: null,
        }}
      />,
    );

    expect(getAllByText('Premium').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Status: Trialing')).toBeTruthy();
    expect(getByText('Trial ends: May 8, 2026')).toBeTruthy();
  });

  it('renders a paid premium state with renewal date', () => {
    const { getAllByText, getByText } = render(
      <PremiumSection
        premium={{
          isPremium: true,
          status: 'active',
          trialEndsAt: null,
          currentPeriodEndsAt: '2026-06-03T00:00:00.000Z',
        }}
      />,
    );

    expect(getAllByText('Premium').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Status: Active')).toBeTruthy();
    expect(getByText('Renews on: Jun 3, 2026')).toBeTruthy();
  });
});
