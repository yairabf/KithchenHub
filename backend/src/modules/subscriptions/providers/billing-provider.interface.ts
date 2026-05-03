import type {
  BillingProviderKey,
  NormalizedBillingWebhookEvent,
} from './billing-provider.types';

export interface BillingProviderService {
  readonly provider: BillingProviderKey;
  parseWebhookEvent(payload: unknown): NormalizedBillingWebhookEvent;
}
