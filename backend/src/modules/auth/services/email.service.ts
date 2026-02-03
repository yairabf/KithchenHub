import { Injectable, Logger } from '@nestjs/common';
import { loadConfiguration } from '../../../config/configuration';

/**
 * Email service for sending verification and other auth-related emails.
 *
 * For MVP, this service logs emails to the console/logs.
 * In production, this can be replaced with SMTP (nodemailer), SendGrid, AWS SES, etc.
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

    if (this.config.email) {
      // If SMTP is configured, send real email
      // For now, log it (can be extended with nodemailer)
      this.logger.log(
        `[EMAIL] Would send verification email to ${email} via SMTP`,
        {
          to: email,
          subject: 'Verify your Kitchen Hub account',
          verificationUrl,
        },
      );
    } else {
      // Log-based email for development
      this.logger.log(
        `[EMAIL VERIFICATION] To: ${email}${name ? ` (${name})` : ''}`,
      );
      this.logger.log(`Verification URL: ${verificationUrl}`);
      this.logger.log(`Token: ${token}`);
    }
  }

  /**
   * Builds the email verification URL.
   * In production, this would be a frontend URL that calls the verify-email endpoint.
   *
   * @param token - Email verification token
   * @returns Verification URL
   */
  private buildVerificationUrl(token: string): string {
    const baseUrl = this.config.auth.backendBaseUrl;
    return `${baseUrl}/api/v1/auth/verify-email?token=${token}`;
  }
}
