import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PremiumDemoSection } from '../PremiumDemoSection';

const mockGetDemo = jest.fn();

jest.mock('../../services/premiumDemoApi', () => ({
  premiumDemoApi: {
    getDemo: () => mockGetDemo(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'premium.demoTitle': 'Premium demo',
        'premium.demoLocked': 'Unlock Premium to access this demo feature.',
        'premium.demoError': 'Unable to load premium demo right now.',
        'premium.demoRefresh': 'Refresh demo',
      }[key] ?? key),
  }),
}));

describe('PremiumDemoSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows locked placeholder and does not call api for non-premium households', () => {
    const { getByText } = render(<PremiumDemoSection isPremium={false} />);

    expect(getByText('Premium demo')).toBeTruthy();
    expect(getByText('Unlock Premium to access this demo feature.')).toBeTruthy();
    expect(mockGetDemo).not.toHaveBeenCalled();
  });

  it('loads and renders premium demo payload for premium households', async () => {
    mockGetDemo.mockResolvedValue({
      featureKey: 'premium_demo',
      title: 'Premium Demo Feature',
      message: 'Premium household unlocked: demo payload.',
      householdId: 'household-1',
    });

    const { getByText } = render(<PremiumDemoSection isPremium />);

    await waitFor(() => {
      expect(getByText('Premium household unlocked: demo payload.')).toBeTruthy();
    });
  });
});
