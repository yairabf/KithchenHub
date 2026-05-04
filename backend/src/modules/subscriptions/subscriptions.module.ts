import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { BillingProviderRegistryService } from './providers/billing-provider-registry.service';
import { RevenueCatBillingProviderService } from './providers/revenuecat-billing-provider.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { SubscriptionWebhooksService } from './services/subscription-webhooks.service';
import { SubscriptionWebhooksController } from './controllers/subscription-webhooks.controller';
import { SubscriptionReconciliationService } from './services/subscription-reconciliation.service';
import { SubscriptionReconciliationController } from './controllers/subscription-reconciliation.controller';
import { SubscriptionSupportOverridesController } from './controllers/subscription-support-overrides.controller';
import { SubscriptionSupportOverridesService } from './services/subscription-support-overrides.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    SubscriptionWebhooksController,
    SubscriptionReconciliationController,
    SubscriptionSupportOverridesController,
  ],
  providers: [
    SubscriptionsRepository,
    SubscriptionsService,
    SubscriptionWebhooksService,
    SubscriptionReconciliationService,
    SubscriptionSupportOverridesService,
    RevenueCatBillingProviderService,
    BillingProviderRegistryService,
  ],
  exports: [
    SubscriptionsRepository,
    SubscriptionsService,
    SubscriptionWebhooksService,
    SubscriptionReconciliationService,
    RevenueCatBillingProviderService,
    BillingProviderRegistryService,
  ],
})
export class SubscriptionsModule {}
