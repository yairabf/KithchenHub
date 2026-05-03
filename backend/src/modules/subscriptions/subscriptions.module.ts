import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { BillingProviderRegistryService } from './providers/billing-provider-registry.service';
import { RevenueCatBillingProviderService } from './providers/revenuecat-billing-provider.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { SubscriptionWebhooksService } from './services/subscription-webhooks.service';
import { SubscriptionWebhooksController } from './controllers/subscription-webhooks.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionWebhooksController],
  providers: [
    SubscriptionsRepository,
    SubscriptionsService,
    SubscriptionWebhooksService,
    RevenueCatBillingProviderService,
    BillingProviderRegistryService,
  ],
  exports: [
    SubscriptionsRepository,
    SubscriptionsService,
    SubscriptionWebhooksService,
    RevenueCatBillingProviderService,
    BillingProviderRegistryService,
  ],
})
export class SubscriptionsModule {}
