import { SupportTicketsController } from './support-tickets.controller';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { AuthenticatedFastifyRequest } from '../../../common/types/fastify-request.interface';
import { SupportTicketRateLimitService } from '../services/support-ticket-rate-limit.service';
import { SupportTicketsService } from '../services/support-tickets.service';

const payload = {
  platform: 'iOS app',
  category: 'Bug',
  summary: 'Shopping list freezes',
  contactEmail: 'user@example.com',
  privacyAcknowledged: true,
};

const request = {
  user: { userId: 'user-1' },
} as AuthenticatedFastifyRequest;

describe('SupportTicketsController', () => {
  it('does not mark support ticket submission as public', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, SupportTicketsController),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        SupportTicketsController.prototype.createTicket,
      ),
    ).toBeUndefined();
  });

  it('delegates support ticket creation to the service and consumes quota after success', async () => {
    const service = {
      createTicket: jest.fn().mockResolvedValue({
        referenceId: 'support-2026-05-25T00-00-00-000Z',
        submittedAt: '2026-05-25T00:00:00.000Z',
      }),
    } as unknown as SupportTicketsService;
    const rateLimitService = {
      consume: jest.fn(),
    } as unknown as SupportTicketRateLimitService;
    const controller = new SupportTicketsController(service, rateLimitService);

    await expect(controller.createTicket(payload, request)).resolves.toEqual({
      referenceId: 'support-2026-05-25T00-00-00-000Z',
      submittedAt: '2026-05-25T00:00:00.000Z',
    });
    expect(service.createTicket).toHaveBeenCalledWith(payload);
    expect(rateLimitService.consume).toHaveBeenCalledWith('user-1');
  });

  it('does not consume rate-limit quota when ticket creation fails', async () => {
    const service = {
      createTicket: jest
        .fn()
        .mockRejectedValue(new Error('Failed to submit support ticket')),
    } as unknown as SupportTicketsService;
    const rateLimitService = {
      consume: jest.fn(),
    } as unknown as SupportTicketRateLimitService;
    const controller = new SupportTicketsController(service, rateLimitService);

    await expect(controller.createTicket(payload, request)).rejects.toThrow(
      'Failed to submit support ticket',
    );
    expect(rateLimitService.consume).not.toHaveBeenCalled();
  });
});
