import React from 'react';
import { render } from '@testing-library/react-native';
import { PremiumSection } from './PremiumSection';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'premium.title': 'Premium',
        'premium.cardTitle': 'KitchenHub Premium',
        'premium.planFree': 'Free plan',
        'premium.planPremium': 'Premium plan',
        'premium.statusLabel': 'Status',
        'premium.statusInactive': 'Inactive',
        'premium.statusActive': 'Active',
        'premium.statusTrialing': 'Trialing',
        'premium.statusPastDue': 'Past due',
        'premium.statusCanceled': 'Canceled',
        'premium.description': 'Unlock AI-powered household features.',
        'premium.featureVoiceAdd': 'Voice grocery add',
        'premium.featureSmartMatching': 'Smart grocery matching',
        'premium.featureRecipeImport': 'AI recipe import',
        'premium.comingSoon': 'Upgrade and billing controls are coming soon.',
      }[key] ?? key),
  }),
}));

describe('PremiumSection', () => {
  it('renders a free plan state by default', () => {
    const { getByText } = render(<PremiumSection />);

    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Free plan')).toBeTruthy();
    expect(getByText('Status: Inactive')).toBeTruthy();
  });

  it('renders an active premium state when provided', () => {
    const { getByText } = render(
      <PremiumSection
        subscription={{
          planKey: 'premium',
          status: 'active',
          entitlements: ['ai_voice_add'],
        }}
      />,
    );

    expect(getByText('Premium plan')).toBeTruthy();
    expect(getByText('Status: Active')).toBeTruthy();
    expect(getByText('Voice grocery add')).toBeTruthy();
  });
});
