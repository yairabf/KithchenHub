import { api } from '../../../services/api';

export interface PremiumDemoResponse {
  featureKey: 'premium_demo';
  title: string;
  message: string;
  householdId: string | null;
}

export const premiumDemoApi = {
  getDemo: (): Promise<PremiumDemoResponse> =>
    api.get<PremiumDemoResponse>('/premium/demo'),
};
