import { BadRequestException, Injectable } from '@nestjs/common';
import type { BillingProviderService } from './billing-provider.interface';
import type { BillingProviderKey } from './billing-provider.types';
import { RevenueCatBillingProviderService } from './revenuecat-billing-provider.service';

@Injectable()
export class BillingProviderRegistryService {
  private readonly providers: BillingProviderService[];

  constructor(
    private readonly revenueCatBillingProviderService: RevenueCatBillingProviderService,
  ) {
    this.providers = [revenueCatBillingProviderService];
  }

  getDefaultProvider(): BillingProviderService {
    return this.getProvider('revenuecat');
  }

  getProvider(provider: BillingProviderKey | string): BillingProviderService {
    const resolvedProvider = this.providers.find(
      (candidate) => candidate.provider === provider,
    );

    if (!resolvedProvider) {
      throw new BadRequestException(
        `Unsupported billing provider: ${provider}`,
      );
    }

    return resolvedProvider;
  }

  listProviders(): BillingProviderKey[] {
    return this.providers.map((provider) => provider.provider);
  }
}
