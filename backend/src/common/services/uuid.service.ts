import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Service for generating unique identifiers.
 * Encapsulates the crypto library to facilitate testing and potential future replacements.
 */
@Injectable()
export class UuidService {
  /**
   * Generates a random UUID (v4).
   *
   * @returns A string containing a random UUID.
   */
  generate(): string {
    return crypto.randomUUID();
  }
}
