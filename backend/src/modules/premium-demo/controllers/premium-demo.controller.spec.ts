import { Test, TestingModule } from '@nestjs/testing';
import { PremiumDemoController } from './premium-demo.controller';
import { PremiumDemoService } from '../services/premium-demo.service';
import { EntitlementGuard } from '../../../common/guards';

describe('PremiumDemoController', () => {
  let controller: PremiumDemoController;

  const mockPremiumDemoService = {
    getDemoPayload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PremiumDemoController],
      providers: [
        {
          provide: PremiumDemoService,
          useValue: mockPremiumDemoService,
        },
      ],
    })
      .overrideGuard(EntitlementGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PremiumDemoController>(PremiumDemoController);
    jest.clearAllMocks();
  });

  it('returns premium demo payload for the authenticated household', () => {
    const user = {
      userId: 'user-1',
      email: 'test@example.com',
      householdId: 'household-1',
    };

    mockPremiumDemoService.getDemoPayload.mockReturnValue({
      featureKey: 'premium_demo',
      title: 'Premium Demo Feature',
      message: 'demo payload',
      householdId: 'household-1',
    });

    expect(controller.getPremiumDemo(user)).toEqual({
      featureKey: 'premium_demo',
      title: 'Premium Demo Feature',
      message: 'demo payload',
      householdId: 'household-1',
    });

    expect(mockPremiumDemoService.getDemoPayload).toHaveBeenCalledWith(
      'household-1',
    );
  });
});
