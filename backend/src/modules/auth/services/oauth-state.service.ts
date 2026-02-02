import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { loadConfiguration } from '../../../config/configuration';

/**
 * Interface for OAuth state metadata
 */
export interface OAuthStateMetadata {
  householdId?: string;
  redirectUri?: string; // Web redirect URI for web platform
}

/**
 * Interface for decoded OAuth state
 */
export interface DecodedOAuthState {
  nonce: string;
  timestamp: number;
  metadata?: OAuthStateMetadata;
}

/**
 * Service for managing OAuth state tokens with CSRF protection.
 *
 * State tokens are signed using HMAC-SHA256 to prevent tampering and include:
 * - Random nonce for uniqueness
 * - Timestamp for expiration checking (5 minute TTL)
 * - Optional metadata (e.g., householdId for join flows)
 *
 * Format: base64(nonce:timestamp:metadata).signature
 */
@Injectable()
export class OAuthStateService {
  private readonly logger = new Logger(OAuthStateService.name);
  private readonly stateSecret: string;
  private readonly STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const config = loadConfiguration();
    this.stateSecret = config.auth.stateSecret;
  }

  /**
   * Generates a signed state token for CSRF protection.
   *
   * @param metadata - Optional metadata to include in state (e.g., householdId)
   * @returns Signed state token as base64-encoded string
   *
   * @example
   * const state = generateState({ householdId: '123' });
   * // Returns: "nonce:timestamp:metadata.signature"
   */
  generateState(metadata?: OAuthStateMetadata): string {
    const nonce = randomBytes(16).toString('hex');
    const timestamp = Date.now();

    // Create state payload
    const payload: DecodedOAuthState = {
      nonce,
      timestamp,
      metadata,
    };

    const payloadString = Buffer.from(JSON.stringify(payload)).toString(
      'base64',
    );

    // Generate HMAC signature
    const signature = this.generateSignature(payloadString);

    // Return state as: payload.signature
    const state = `${payloadString}.${signature}`;

    this.logger.debug(
      `Generated OAuth state with nonce: ${nonce}${metadata?.householdId ? ` for household: ${metadata.householdId}` : ''}`,
    );

    return state;
  }

  /**
   * Validates and decodes a state token.
   *
   * @param state - State token to validate
   * @returns Decoded state with nonce and metadata
   * @throws UnauthorizedException if state is invalid, expired, or tampered with
   *
   * @example
   * const decoded = validateState(stateFromUrl);
   * console.log(decoded.nonce); // Random nonce
   * console.log(decoded.metadata?.householdId); // Optional household ID
   */
  validateState(state: string): DecodedOAuthState {
    if (!state) {
      this.logger.warn('OAuth state validation failed: missing state');
      throw new UnauthorizedException('Invalid OAuth state: missing state');
    }

    // Split into payload and signature
    const parts = state.split('.');
    if (parts.length !== 2) {
      this.logger.warn('OAuth state validation failed: invalid format');
      throw new UnauthorizedException('Invalid OAuth state: malformed token');
    }

    const [payloadString, receivedSignature] = parts;

    // Verify signature
    const expectedSignature = this.generateSignature(payloadString);
    if (receivedSignature !== expectedSignature) {
      this.logger.warn('OAuth state validation failed: signature mismatch');
      throw new UnauthorizedException(
        'Invalid OAuth state: signature mismatch',
      );
    }

    // Decode payload
    let payload: DecodedOAuthState;
    try {
      const decoded = Buffer.from(payloadString, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (error) {
      this.logger.warn(
        `OAuth state validation failed: unable to decode payload - ${error}`,
      );
      throw new UnauthorizedException('Invalid OAuth state: malformed payload');
    }

    // Validate timestamp (5 minute expiry)
    const now = Date.now();
    const age = now - payload.timestamp;
    if (age > this.STATE_TTL_MS) {
      this.logger.warn(
        `OAuth state validation failed: expired (age: ${Math.round(age / 1000)}s)`,
      );
      throw new UnauthorizedException(
        'Invalid OAuth state: token expired (max 5 minutes)',
      );
    }

    if (age < 0) {
      this.logger.warn('OAuth state validation failed: timestamp in future');
      throw new UnauthorizedException('Invalid OAuth state: invalid timestamp');
    }

    this.logger.debug(`Validated OAuth state with nonce: ${payload.nonce}`);
    return payload;
  }

  /**
   * Generates HMAC-SHA256 signature for a payload.
   *
   * @param payload - Payload string to sign
   * @returns Hex-encoded signature
   */
  private generateSignature(payload: string): string {
    return createHmac('sha256', this.stateSecret).update(payload).digest('hex');
  }
}
