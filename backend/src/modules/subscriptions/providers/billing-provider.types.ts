export const BILLING_PROVIDER_KEYS = ['revenuecat'] as const;

export type BillingProviderKey = (typeof BILLING_PROVIDER_KEYS)[number];

export interface NormalizedBillingWebhookEvent {
  provider: BillingProviderKey;
  providerEventId: string;
  eventType: string;
  providerAppUserId: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  productId: string | null;
  entitlementKeys: string[];
  store: string | null;
  rawEvent: Record<string, unknown>;
}
