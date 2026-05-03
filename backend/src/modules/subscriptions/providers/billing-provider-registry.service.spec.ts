import { BadRequestException } from '@nestjs/common';
import { BillingProviderRegistryService } from './billing-provider-registry.service';
import { RevenueCatBillingProviderService } from './revenuecat-billing-provider.service';

describe('BillingProviderRegistryService', () => {
  let revenueCatProvider: RevenueCatBillingProviderService;
  let registry: BillingProviderRegistryService;

  beforeEach(() => {
    revenueCatProvider = new RevenueCatBillingProviderService();
    registry = new BillingProviderRegistryService(revenueCatProvider);
  });

  it('returns the configured default billing provider', () => {
    expect(registry.getDefaultProvider().provider).toBe('revenuecat');
  });

  it('resolves a provider by key', () => {
    expect(registry.getProvider('revenuecat')).toBe(revenueCatProvider);
  });

  it('throws for an unsupported provider key', () => {
    expect(() => registry.getProvider('unknown-provider')).toThrow(
      BadRequestException,
    );
  });
});
