import { Injectable, Logger } from '@nestjs/common';
import { loadConfiguration } from '../../../config/configuration';

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Email service for sending verification and other auth-related emails.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config = loadConfiguration();

  /**
   * Sends an email verification email to the user.
   *
   * @param email - User's email address
   * @param token - Email verification token
   * @param name - Optional user name for personalization
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    name?: string,
  ): Promise<void> {
    const verificationUrl = this.buildVerificationUrl(token);
    const resendApiKey = this.config.email.resendApiKey;

    if (resendApiKey) {
      await this.sendWithResend(email, verificationUrl, name, resendApiKey);
      return;
    }

    // Log-based email for local development when Resend is not configured.
    this.logger.warn(
      `[EMAIL VERIFICATION] Resend is not configured; verification email was not sent to ${email}${name ? ` (${name})` : ''}`,
    );
    this.logger.log(`Verification URL: ${verificationUrl}`);
  }

  private async sendWithResend(
    email: string,
    verificationUrl: string,
    name: string | undefined,
    resendApiKey: string,
  ): Promise<void> {
    const recipientName = name?.trim() || 'there';
    const response = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.email.from,
        to: [email],
        subject: 'Verify your Kitchen Hub account',
        html: this.buildVerificationHtml(recipientName, verificationUrl),
        text: this.buildVerificationText(recipientName, verificationUrl),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error('Resend verification email request failed', {
        status: response.status,
        to: email,
        error: errorBody,
      });
      throw new Error('Failed to send verification email');
    }

    this.logger.log(`Sent verification email to ${email} via Resend`);
  }

  private buildVerificationHtml(name: string, verificationUrl: string): string {
    return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h1>Verify your Kitchen Hub account</h1>
    <p>Hi ${this.escapeHtml(name)},</p>
    <p>Thanks for registering for Kitchen Hub. Please verify your email address to finish setting up your account.</p>
    <p>
      <a href="${verificationUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Verify email
      </a>
    </p>
    <p>If the button does not work, copy and paste this link into your browser:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>If you did not create this account, you can ignore this email.</p>
  </body>
</html>`;
  }

  private buildVerificationText(name: string, verificationUrl: string): string {
    return [
      'Verify your Kitchen Hub account',
      '',
      `Hi ${name},`,
      '',
      'Thanks for registering for Kitchen Hub. Please verify your email address to finish setting up your account.',
      '',
      verificationUrl,
      '',
      'If you did not create this account, you can ignore this email.',
    ].join('\n');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Builds the email verification URL.
   *
   * @param token - Email verification token
   * @returns Verification URL
   */
  private buildVerificationUrl(token: string): string {
    const baseUrl = this.config.auth.backendBaseUrl;
    return `${baseUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`;
  }
}
