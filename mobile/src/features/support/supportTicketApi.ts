import { api } from '../../services/api';
import type { SupportTicketDraft } from './supportTicket';

export type SupportTicketSubmissionResponse = {
  referenceId: string;
  submittedAt: string;
};

export const submitSupportTicket = (
  draft: SupportTicketDraft,
): Promise<SupportTicketSubmissionResponse> =>
  api.post<SupportTicketSubmissionResponse, SupportTicketDraft>(
    '/support/tickets',
    draft,
  );
