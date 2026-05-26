import { api } from '../../../services/api';
import { createEmptySupportTicketDraft } from '../supportTicket';
import { submitSupportTicket } from '../supportTicketApi';

jest.mock('../../../services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

const mockPost = api.post as jest.MockedFunction<typeof api.post>;

describe('submitSupportTicket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({
      referenceId: 'support-2026-05-25T00-00-00-000Z',
      submittedAt: '2026-05-25T00:00:00.000Z',
    });
  });

  it('posts the support ticket draft to the backend support intake endpoint', async () => {
    const draft = createEmptySupportTicketDraft({
      platform: 'iOS app',
      category: 'Bug',
      summary: 'Shopping list freezes',
      contactEmail: 'user@example.com',
      privacyAcknowledged: true,
    });

    await expect(submitSupportTicket(draft)).resolves.toEqual({
      referenceId: 'support-2026-05-25T00-00-00-000Z',
      submittedAt: '2026-05-25T00:00:00.000Z',
    });

    expect(mockPost).toHaveBeenCalledWith('/support/tickets', draft);
  });
});
