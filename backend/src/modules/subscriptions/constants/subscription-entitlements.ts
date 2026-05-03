export const FREE_PLAN_KEY = 'free';
export const PREMIUM_PLAN_KEY = 'premium';

export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;

export const PREMIUM_PLAN_ENTITLEMENTS = [
  'ai_voice_add',
  'ai_smart_item_matching',
  'ai_recipe_import',
  'ai_meal_planning',
  'ai_list_cleanup',
] as const;

export function createDefaultFreeSubscriptionSummary() {
  return {
    planKey: FREE_PLAN_KEY,
    status: 'inactive',
    entitlements: [] as string[],
    trialEndsAt: null,
    currentPeriodEndsAt: null,
  };
}
