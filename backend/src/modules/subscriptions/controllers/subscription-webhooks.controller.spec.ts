import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';
import { SubscriptionWebhooksService } from '../services/subscription-webhooks.service';

describe('SubscriptionWebhooksController', () => {
  let controller: SubscriptionWebhooksController;

  const mockSubscriptionWebhooksService = {
    processWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionWebhooksController],
      providers: [
        {
          provide: SubscriptionWebhooksService,
          useValue: mockSubscriptionWebhooksService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionWebhooksController>(
      SubscriptionWebhooksController,
    );
    jest.clearAllMocks();
  });

  it('delegates provider webhook payloads to subscription webhook service', async () => {
    const payload = { event: { id: 'evt_1' } };
    mockSubscriptionWebhooksService.processWebhook.mockResolvedValue({
      accepted: true,
      duplicate: false,
      eventId: 'event-1',
    });

    await expect(
      controller.handleProviderWebhook('revenuecat', payload),
    ).resolves.toEqual({
      accepted: true,
      duplicate: false,
      eventId: 'event-1',
    });

    expect(mockSubscriptionWebhooksService.processWebhook).toHaveBeenCalledWith(
      'revenuecat',
      payload,
    );
  });
});
