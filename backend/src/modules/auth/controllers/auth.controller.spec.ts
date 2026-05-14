import { AuthController } from './auth.controller';

describe('AuthController', () => {
  describe('verifyEmailGet', () => {
    it('renders a friendly HTML success page instead of returning auth JSON', async () => {
      const authService = {
        verifyEmail: jest.fn().mockResolvedValue({
          accessToken: 'secret-access-token',
          refreshToken: 'secret-refresh-token',
          user: { id: 'user-1', email: 'test@example.com' },
        }),
      };
      const controller = new AuthController(authService as any);
      const reply = {
        type: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      const result = await (controller as any).verifyEmailGet(
        'valid-token',
        reply,
      );

      expect(authService.verifyEmail).toHaveBeenCalledWith({
        token: 'valid-token',
      });
      expect(reply.type).toHaveBeenCalledWith('text/html; charset=utf-8');
      expect(reply.send).toHaveBeenCalledWith(
        expect.stringContaining('Email was verified'),
      );
      expect(reply.send).toHaveBeenCalledWith(
        expect.not.stringContaining('secret-access-token'),
      );
      expect(reply.send).toHaveBeenCalledWith(
        expect.not.stringContaining('secret-refresh-token'),
      );
      expect(result).toBeUndefined();
    });
  });
});
