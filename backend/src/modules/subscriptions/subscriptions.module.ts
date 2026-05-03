import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { BillingProviderRegistryService } from './providers/billing-provider-registry.service';
import { RevenueCatBillingProviderService } from './providers/revenuecat-billing-provider.service';
import { SubscriptionsService } from './services/subscriptions.service';

@Module({
  imports: [PrismaModule],
  providers: [
    SubscriptionsRepository,
    SubscriptionsService,
    RevenueCatBillingProviderService,
    BillingProviderRegistryService,
  ],
  exports: [
    SubscriptionsRepository,
    SubscriptionsService,
    RevenueCatBillingProviderService,
    BillingProviderRegistryService,
  ],
})
export class SubscriptionsModule {}
