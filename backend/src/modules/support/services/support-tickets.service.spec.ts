import { SupportTicketsService } from './support-tickets.service';

const mockLoadConfiguration = jest.fn();

jest.mock('../../../config/configuration', () => ({
  loadConfiguration: () => mockLoadConfiguration(),
}));

describe('SupportTicketsService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadConfiguration.mockReturnValue({
      email: {
        resendApiKey: 'test-resend-api-key',
        from: 'no-reply@fullhouse.app',
        supportFrom: 'support@fullhouse.app',
        supportTo: 'help@fullhouse.app',
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-email-id' }),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the support ticket to the configured support mailbox through Resend', async () => {
    const service = new SupportTicketsService();

    const result = await service.createTicket({
      platform: 'iOS app',
      category: 'Bug',
      summary: 'Shopping list freezes',
      expectedBehavior: 'Milk should be added immediately',
      actualBehavior: 'The spinner stays visible',
      reproductionSteps: 'Open Shopping, add milk',
      frequency: 'Every time',
      contactEmail: 'user@example.com',
      appVersion: '1.0.1',
      deviceContext: 'ios 18.1',
      attachmentNote: 'Screenshot available',
      privacyAcknowledged: true,
    });

    expect(result.referenceId).toMatch(/^support-/);
    expect(result.submittedAt).toEqual(expect.any(String));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-resend-api-key',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body).toEqual(
      expect.objectContaining({
        from: 'support@fullhouse.app',
        to: ['help@fullhouse.app'],
        reply_to: 'user@example.com',
        subject: '[FullHouse Support][iOS app][Bug] Shopping list freezes',
      }),
    );
    expect(body.text).toContain('Contact email: user@example.com');
    expect(body.text).toContain('Privacy reminder: Do not send passwords');
    expect(body.html).toContain('Shopping list freezes');
    expect(body.html).toContain('user@example.com');
  });

  it('falls back to general email sender and default destination when support email overrides are not configured', async () => {
    mockLoadConfiguration.mockReturnValue({
      email: {
        resendApiKey: 'test-resend-api-key',
        from: 'no-reply@fullhouse.app',
      },
    });
    const service = new SupportTicketsService();

    await service.createTicket({
      platform: 'iOS app',
      category: 'Bug',
      summary: 'Shopping list freezes',
      contactEmail: 'user@example.com',
      privacyAcknowledged: true,
    });

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body).toEqual(
      expect.objectContaining({
        from: 'no-reply@fullhouse.app',
        to: ['yair.solutions.19@gmail.com'],
      }),
    );
  });

  it('throws a safe error when Resend rejects the support ticket email', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'domain not verified',
    } as Response);
    const service = new SupportTicketsService();

    await expect(
      service.createTicket({
        platform: 'iOS app',
        category: 'Bug',
        summary: 'Shopping list freezes',
        contactEmail: 'user@example.com',
        privacyAcknowledged: true,
      }),
    ).rejects.toThrow('Failed to submit support ticket');
  });

  it('throws a safe error when Resend transport fails', async () => {
    expect.assertions(2);
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.resend.com'));
    const service = new SupportTicketsService();

    await service
      .createTicket({
        platform: 'iOS app',
        category: 'Bug',
        summary: 'Shopping list freezes',
        contactEmail: 'user@example.com',
        privacyAcknowledged: true,
      })
      .catch((error: Error) => {
        expect(error.message).toBe('Failed to submit support ticket');
        expect(error.message).not.toContain('getaddrinfo ENOTFOUND');
      });
  });
});
