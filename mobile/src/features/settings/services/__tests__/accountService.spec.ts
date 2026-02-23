import { accountService } from '../accountService';
import { api } from '../../../../services/api';

jest.mock('../../../../services/api', () => ({
  api: {
    delete: jest.fn(),
  },
}));

describe('accountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteMyAccount', () => {
    describe.each([
      ['no reason provided', undefined, '/users/me'],
      ['empty string reason', '', '/users/me'],
      ['whitespace-only reason', '   ', '/users/me'],
      ['valid reason', 'Not needed anymore', '/users/me?reason=Not+needed+anymore'],
      ['reason with special characters', 'Switched to competitor & unhappy', '/users/me?reason=Switched+to+competitor+%26+unhappy'],
      ['reason with unicode', 'لا أحتاج إلى ذلك', '/users/me?reason=%D9%84%D8%A7+%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC+%D8%A5%D9%84%D9%89+%D8%B0%D9%84%D9%83'],
    ])('with %s', (description, reason, expectedEndpoint) => {
      it(`should call api.delete with ${expectedEndpoint}`, async () => {
        (api.delete as jest.Mock).mockResolvedValueOnce(undefined);

        await accountService.deleteMyAccount(reason ? { reason } : undefined);

        expect(api.delete).toHaveBeenCalledTimes(1);
        expect(api.delete).toHaveBeenCalledWith(expectedEndpoint);
      });
    });

    it('should propagate network errors', async () => {
      const networkError = new Error('Network request failed');
      (api.delete as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(accountService.deleteMyAccount()).rejects.toThrow('Network request failed');
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('401 Unauthorized');
      (api.delete as jest.Mock).mockRejectedValueOnce(apiError);

      await expect(accountService.deleteMyAccount()).rejects.toThrow('401 Unauthorized');
    });

    it('should trim whitespace from reason before encoding', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce(undefined);

      await accountService.deleteMyAccount({ reason: '  My reason  ' });

      expect(api.delete).toHaveBeenCalledWith('/users/me?reason=My+reason');
    });
  });
});
