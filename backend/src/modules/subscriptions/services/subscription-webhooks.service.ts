import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { loadConfiguration } from '../../../config/configuration';
import { BillingProviderRegistryService } from '../providers/billing-provider-registry.service';
import type { BillingProviderKey } from '../providers/billing-provider.types';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

const PREMIUM_PLAN_KEY = 'premium';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface WebhookProcessingResult {
  accepted: true;
  duplicate: boolean;
  eventId: string;
}

@Injectable()
export class SubscriptionWebhooksService {
  private readonly logger = new Logger(SubscriptionWebhooksService.name);

  constructor(
    private readonly billingProviderRegistryService: BillingProviderRegistryService,
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async processWebhook(
    provider: string,
    payload: unknown,
    headers: Record<string, string | string[] | undefined> = {},
  ): Promise<WebhookProcessingResult> {
    this.assertProviderWebhookIsAuthorized(provider, headers);

    const providerService =
      this.billingProviderRegistryService.getProvider(provider);
    const normalizedEvent = providerService.parseWebhookEvent(payload);

    const existingEvent = await this.subscriptionsRepository.findBillingEvent(
      normalizedEvent.provider,
      normalizedEvent.providerEventId,
    );

    if (existingEvent) {
      return {
        accepted: true,
        duplicate: true,
        eventId: existingEvent.id,
      };
    }

    const householdId = await this.resolveHouseholdId(normalizedEvent);

    const createdEvent = await this.subscriptionsRepository.createBillingEvent({
      provider: normalizedEvent.provider,
      providerEventId: normalizedEvent.providerEventId,
      eventType: normalizedEvent.eventType,
      providerAppUserId: normalizedEvent.providerAppUserId,
      providerCustomerId: normalizedEvent.providerCustomerId,
      providerSubscriptionId: normalizedEvent.providerSubscriptionId,
      householdId,
      payload: normalizedEvent.rawEvent as Prisma.InputJsonValue,
    });

    try {
      if (householdId && this.isPremiumEvent(normalizedEvent)) {
        await this.subscriptionsRepository.upsertHouseholdSubscription({
          householdId,
          purchaserUserId: this.asValidUserId(
            normalizedEvent.providerAppUserId,
          ),
          planKey: PREMIUM_PLAN_KEY,
          billingInterval: this.resolveBillingInterval(
            normalizedEvent.productId,
          ),
          status: this.resolveSubscriptionStatus(normalizedEvent.eventType),
          provider: normalizedEvent.provider,
          store: normalizedEvent.store,
          providerAppUserId: normalizedEvent.providerAppUserId,
          providerCustomerId: normalizedEvent.providerCustomerId,
          providerSubscriptionId: normalizedEvent.providerSubscriptionId,
          providerProductId: normalizedEvent.productId,
          providerEntitlementKey:
            normalizedEvent.entitlementKeys[0] ?? PREMIUM_PLAN_KEY,
          isTrial: this.isTrialEvent(normalizedEvent.eventType),
          cancelAtPeriodEnd: this.isCancellationEvent(normalizedEvent.eventType)
            ? true
            : null,
          canceledAt: this.isCancellationEvent(normalizedEvent.eventType)
            ? new Date()
            : null,
          endsAt: this.isExpirationEvent(normalizedEvent.eventType)
            ? new Date()
            : null,
        });
      }

      await this.subscriptionsRepository.markBillingEventProcessed(
        createdEvent.id,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown webhook processing error';
      this.logger.error(
        `Webhook processing failed for provider=${provider}, eventId=${createdEvent.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.subscriptionsRepository.markBillingEventFailed(
        createdEvent.id,
        errorMessage,
      );
      throw error;
    }

    return {
      accepted: true,
      duplicate: false,
      eventId: createdEvent.id,
    };
  }

  private assertProviderWebhookIsAuthorized(
    provider: string,
    headers: Record<string, string | string[] | undefined>,
  ): void {
    const config = loadConfiguration();

    if (provider !== 'revenuecat') {
      return;
    }

    const headerName = config.subscriptions?.revenuecat?.webhookAuthHeader;
    const expectedSecret = config.subscriptions?.revenuecat?.webhookAuthSecret;

    if (!headerName || !expectedSecret) {
      return;
    }

    const normalizedHeaderName = headerName.toLowerCase();
    const providedSecret = headers[normalizedHeaderName];
    const providedSecretValue = Array.isArray(providedSecret)
      ? providedSecret[0]
      : providedSecret;

    if (providedSecretValue !== expectedSecret) {
      this.logger.warn(
        `Rejected unauthorized webhook request for provider=${provider} (missing or invalid auth header: ${normalizedHeaderName})`,
      );
      throw new UnauthorizedException('Webhook authorization failed');
    }
  }

  private async resolveHouseholdId(normalizedEvent: {
    provider: BillingProviderKey;
    providerAppUserId: string | null;
    providerCustomerId: string | null;
  }): Promise<string | null> {
    const providerUserIds = [
      normalizedEvent.providerAppUserId,
      normalizedEvent.providerCustomerId,
    ];

    for (const providerUserId of providerUserIds) {
      const validUserId = this.asValidUserId(providerUserId);
      if (!validUserId) {
        continue;
      }

      const householdId =
        await this.subscriptionsRepository.findUserHouseholdId(validUserId);
      if (householdId) {
        return householdId;
      }
    }

    return null;
  }

  private asValidUserId(value: string | null): string | null {
    if (!value) {
      return null;
    }

    return UUID_REGEX.test(value) ? value : null;
  }

  private isPremiumEvent(normalizedEvent: {
    entitlementKeys: string[];
    productId: string | null;
  }): boolean {
    return (
      normalizedEvent.entitlementKeys.includes(PREMIUM_PLAN_KEY) ||
      Boolean(
        normalizedEvent.productId?.toLowerCase().includes(PREMIUM_PLAN_KEY),
      )
    );
  }

  private resolveBillingInterval(productId: string | null): string | null {
    if (!productId) {
      return null;
    }

    const normalizedProductId = productId.toLowerCase();

    if (
      normalizedProductId.includes('year') ||
      normalizedProductId.includes('annual')
    ) {
      return 'yearly';
    }

    if (normalizedProductId.includes('month')) {
      return 'monthly';
    }

    return null;
  }

  private resolveSubscriptionStatus(eventType: string): string {
    const normalizedEventType = eventType.toUpperCase();

    if (this.isTrialEvent(normalizedEventType)) {
      return 'trialing';
    }

    if (this.isCancellationEvent(normalizedEventType)) {
      return 'canceled';
    }

    if (this.isExpirationEvent(normalizedEventType)) {
      return 'expired';
    }

    if (normalizedEventType.includes('BILLING_ISSUE')) {
      return 'past_due';
    }

    return 'active';
  }

  private isTrialEvent(eventType: string): boolean {
    return eventType.toUpperCase().includes('TRIAL');
  }

  private isCancellationEvent(eventType: string): boolean {
    return eventType.toUpperCase().includes('CANCELLATION');
  }

  private isExpirationEvent(eventType: string): boolean {
    return eventType.toUpperCase().includes('EXPIRATION');
  }
}
