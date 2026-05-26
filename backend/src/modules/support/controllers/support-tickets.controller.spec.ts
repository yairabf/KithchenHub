import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketsService } from '../services/support-tickets.service';

const payload = {
  platform: 'iOS app',
  category: 'Bug',
  summary: 'Shopping list freezes',
  contactEmail: 'user@example.com',
  privacyAcknowledged: true,
};

describe('SupportTicketsController', () => {
  it('delegates support ticket creation to the service', async () => {
    const service = {
      createTicket: jest.fn().mockResolvedValue({
        referenceId: 'support-2026-05-25T00-00-00-000Z',
        submittedAt: '2026-05-25T00:00:00.000Z',
      }),
    } as unknown as SupportTicketsService;
    const controller = new SupportTicketsController(service);

    await expect(controller.createTicket(payload)).resolves.toEqual({
      referenceId: 'support-2026-05-25T00-00-00-000Z',
      submittedAt: '2026-05-25T00:00:00.000Z',
    });
    expect(service.createTicket).toHaveBeenCalledWith(payload);
  });
});
