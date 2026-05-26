import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { loadConfiguration } from '../../../config/configuration';
import type { CreateSupportTicketDto } from '../dtos/create-support-ticket.dto';

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails';
const SUPPORT_EMAIL = 'yair.solutions.19@gmail.com';
const PRIVACY_REMINDER =
  'Privacy reminder: Do not send passwords, full payment card details, or highly sensitive household information.';

export type SupportTicketSubmissionResponse = {
  referenceId: string;
  submittedAt: string;
};

type ResendSupportEmailPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class SupportTicketsService {
  private readonly logger = new Logger(SupportTicketsService.name);
  private readonly config = loadConfiguration();

  async createTicket(
    payload: CreateSupportTicketDto,
  ): Promise<SupportTicketSubmissionResponse> {
    const submittedAt = new Date().toISOString();
    const referenceId = this.buildReferenceId(submittedAt);
    const resendApiKey = this.config.email.resendApiKey;

    if (!resendApiKey) {
      this.logger.error('Resend is not configured for support ticket intake');
      throw new Error('Failed to submit support ticket');
    }

    const emailPayload = this.buildResendPayload(payload, referenceId, submittedAt);
    const response = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error('Resend support ticket request failed', {
        status: response.status,
        referenceId,
        error: errorBody,
      });
      throw new Error('Failed to submit support ticket');
    }

    this.logger.log(`Submitted support ticket ${referenceId} via Resend`);
    return { referenceId, submittedAt };
  }

  private buildReferenceId(submittedAt: string): string {
    const timestamp = submittedAt.replace(/[:.]/g, '-');
    return `support-${timestamp}-${randomUUID().slice(0, 8)}`;
  }

  private buildResendPayload(
    payload: CreateSupportTicketDto,
    referenceId: string,
    submittedAt: string,
  ): ResendSupportEmailPayload {
    const platform = this.valueOrPlaceholder(payload.platform);
    const category = this.valueOrPlaceholder(payload.category);
    const summary = this.valueOrPlaceholder(payload.summary);
    const subject = `[FullHouse Support][${platform}][${category}] ${summary}`;
    const text = this.buildPlainText(payload, referenceId, submittedAt);

    return {
      from: this.config.email.from,
      to: [SUPPORT_EMAIL],
      reply_to: payload.contactEmail.trim(),
      subject,
      text,
      html: this.buildHtml(payload, referenceId, submittedAt),
    };
  }

  private buildPlainText(
    payload: CreateSupportTicketDto,
    referenceId: string,
    submittedAt: string,
  ): string {
    return [
      'FullHouse support ticket',
      '',
      `Reference: ${referenceId}`,
      `Submitted at: ${submittedAt}`,
      `Ticket title: ${this.valueOrPlaceholder(payload.summary)}`,
      `Platform/source: ${this.valueOrPlaceholder(payload.platform)}`,
      `Category: ${this.valueOrPlaceholder(payload.category)}`,
      'Priority hint: User-reported support issue',
      `Expected behavior: ${this.valueOrPlaceholder(payload.expectedBehavior)}`,
      `Actual behavior: ${this.valueOrPlaceholder(payload.actualBehavior)}`,
      `Steps to reproduce: ${this.valueOrPlaceholder(payload.reproductionSteps)}`,
      `Frequency: ${this.valueOrPlaceholder(payload.frequency)}`,
      `Contact email: ${this.valueOrPlaceholder(payload.contactEmail)}`,
      `App/device context: ${this.valueOrPlaceholder([payload.appVersion, payload.deviceContext].filter(Boolean).join(' — '))}`,
      `Attachments: ${this.valueOrPlaceholder(payload.attachmentNote)}`,
      `Privacy acknowledgment: ${payload.privacyAcknowledged ? 'Yes' : 'No'}`,
      '',
      PRIVACY_REMINDER,
    ].join('\n');
  }

  private buildHtml(
    payload: CreateSupportTicketDto,
    referenceId: string,
    submittedAt: string,
  ): string {
    const rows: Array<[string, string | undefined]> = [
      ['Reference', referenceId],
      ['Submitted at', submittedAt],
      ['Ticket title', payload.summary],
      ['Platform/source', payload.platform],
      ['Category', payload.category],
      ['Expected behavior', payload.expectedBehavior],
      ['Actual behavior', payload.actualBehavior],
      ['Steps to reproduce', payload.reproductionSteps],
      ['Frequency', payload.frequency],
      ['Contact email', payload.contactEmail],
      ['App/device context', [payload.appVersion, payload.deviceContext].filter(Boolean).join(' — ')],
      ['Attachments', payload.attachmentNote],
      ['Privacy acknowledgment', payload.privacyAcknowledged ? 'Yes' : 'No'],
    ];

    return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h1>FullHouse support ticket</h1>
    <p><strong>Priority hint:</strong> User-reported support issue</p>
    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 760px;">
      <tbody>
        ${rows
          .map(
            ([label, value]) => `<tr>
          <th align="left" style="border: 1px solid #e5e7eb; background: #f9fafb; width: 180px; vertical-align: top;">${this.escapeHtml(label)}</th>
          <td style="border: 1px solid #e5e7eb; white-space: pre-wrap;">${this.escapeHtml(this.valueOrPlaceholder(value))}</td>
        </tr>`,
          )
          .join('\n')}
      </tbody>
    </table>
    <p>${this.escapeHtml(PRIVACY_REMINDER)}</p>
  </body>
</html>`;
  }

  private valueOrPlaceholder(value: string | undefined): string {
    const trimmed = value?.trim() ?? '';
    return trimmed.length > 0 ? trimmed : 'Not provided';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
