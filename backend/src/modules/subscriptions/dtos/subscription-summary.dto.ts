export class SubscriptionSummaryDto {
  planKey: string;
  status: string;
  entitlements: string[];
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
}
