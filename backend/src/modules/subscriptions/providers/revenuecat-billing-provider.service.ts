import { BadRequestException, Injectable } from '@nestjs/common';
import type { BillingProviderService } from './billing-provider.interface';
import type {
  BillingProviderKey,
  NormalizedBillingWebhookEvent,
} from './billing-provider.types';

interface RevenueCatWebhookPayload {
  event?: Record<string, unknown>;
}

@Injectable()
export class RevenueCatBillingProviderService implements BillingProviderService {
  readonly provider: BillingProviderKey = 'revenuecat';

  parseWebhookEvent(payload: unknown): NormalizedBillingWebhookEvent {
    const event = this.extractEvent(payload);
    const providerEventId = this.readRequiredString(event, 'id');
    const eventType = this.readRequiredString(event, 'type');

    return {
      provider: this.provider,
      providerEventId,
      eventType,
      providerAppUserId: this.readOptionalString(event, 'app_user_id'),
      providerCustomerId:
        this.readOptionalString(event, 'original_app_user_id') ??
        this.readSubscriberOriginalAppUserId(event),
      providerSubscriptionId:
        this.readOptionalString(event, 'transaction_id') ??
        this.readOptionalString(event, 'original_transaction_id'),
      productId: this.readOptionalString(event, 'product_id'),
      entitlementKeys: this.readStringArray(event, 'entitlement_ids'),
      store: this.readOptionalString(event, 'store'),
      rawEvent: event,
    };
  }

  private extractEvent(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException(
        'RevenueCat webhook payload must be an object',
      );
    }

    const { event } = payload as RevenueCatWebhookPayload;

    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      throw new BadRequestException(
        'RevenueCat webhook payload must include an event object',
      );
    }

    return event;
  }

  private readRequiredString(
    source: Record<string, unknown>,
    key: string,
  ): string {
    const value = this.readOptionalString(source, key);

    if (!value) {
      throw new BadRequestException(
        `RevenueCat webhook event is missing required field: ${key}`,
      );
    }

    return value;
  }

  private readOptionalString(
    source: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = source[key];

    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue === '' ? null : trimmedValue;
  }

  private readStringArray(
    source: Record<string, unknown>,
    key: string,
  ): string[] {
    const value = source[key];

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private readSubscriberOriginalAppUserId(
    source: Record<string, unknown>,
  ): string | null {
    const subscriber = source.subscriber;

    if (
      !subscriber ||
      typeof subscriber !== 'object' ||
      Array.isArray(subscriber)
    ) {
      return null;
    }

    return this.readOptionalString(
      subscriber as Record<string, unknown>,
      'original_app_user_id',
    );
  }
}
