import { EmailService } from '../email.service';

const mockLoadConfiguration = jest.fn();

jest.mock('../../../../config/configuration', () => ({
  loadConfiguration: () => mockLoadConfiguration(),
}));

describe('EmailService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-email-id' }),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends verification email through Resend using onboarding@resend.dev by default', async () => {
    mockLoadConfiguration.mockReturnValue({
      auth: {
        backendBaseUrl: 'https://api.kitchenhub.app',
      },
      email: {
        resendApiKey: 'test-resend-api-key',
        from: 'onboarding@resend.dev',
        verificationTokenExpiryHours: 24,
      },
    });

    const service = new EmailService();

    await service.sendVerificationEmail(
      'newuser@example.com',
      'verification-token-123',
      'New User',
    );

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
        from: 'onboarding@resend.dev',
        to: ['newuser@example.com'],
        subject: 'Verify your Kitchen Hub account',
      }),
    );
    expect(body.html).toContain('Hi New User');
    expect(body.html).toContain(
      'https://api.kitchenhub.app/api/v1/auth/verify-email?token=verification-token-123',
    );
    expect(body.text).toContain(
      'https://api.kitchenhub.app/api/v1/auth/verify-email?token=verification-token-123',
    );
  });

  it('throws when Resend rejects the email send request', async () => {
    mockLoadConfiguration.mockReturnValue({
      auth: {
        backendBaseUrl: 'https://api.kitchenhub.app',
      },
      email: {
        resendApiKey: 'test-resend-api-key',
        from: 'onboarding@resend.dev',
        verificationTokenExpiryHours: 24,
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'domain not verified',
    } as Response);

    const service = new EmailService();

    await expect(
      service.sendVerificationEmail(
        'newuser@example.com',
        'verification-token-123',
      ),
    ).rejects.toThrow('Failed to send verification email');
  });
});
