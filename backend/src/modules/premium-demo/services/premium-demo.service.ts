import { Injectable } from '@nestjs/common';

export interface PremiumDemoPayload {
  featureKey: 'premium_demo';
  title: string;
  message: string;
  householdId: string | null;
}

@Injectable()
export class PremiumDemoService {
  getDemoPayload(householdId?: string | null): PremiumDemoPayload {
    return {
      featureKey: 'premium_demo',
      title: 'Premium Demo Feature',
      message:
        'Premium household unlocked: this is the demo placeholder payload from the backend.',
      householdId: householdId ?? null,
    };
  }
}
