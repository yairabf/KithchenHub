import { ApiError, NetworkError } from '../../../services/api';
import type { SyncResult, ErrorClassification } from './syncQueueProcessor.types';

/**
 * Type guard to validate SyncResult structure from backend.
 * Ensures response body has correct structure before processing.
 */
export function isValidSyncResult(data: unknown): data is SyncResult {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const result = data as Record<string, unknown>;

  if (!['synced', 'partial', 'failed'].includes(result.status as string)) {
    return false;
  }

  if (!Array.isArray(result.conflicts)) {
    return false;
  }

  for (const conflict of result.conflicts) {
    const conflictCandidate = conflict as {
      type?: unknown;
      id?: unknown;
      operationId?: unknown;
      reason?: unknown;
    };
    if (
      typeof conflict !== 'object' ||
      !['list', 'recipe', 'chore', 'shoppingItem'].includes(conflictCandidate.type as string) ||
      typeof conflictCandidate.id !== 'string' ||
      typeof conflictCandidate.operationId !== 'string' ||
      typeof conflictCandidate.reason !== 'string'
    ) {
      return false;
    }
  }

  if (result.succeeded !== undefined) {
    if (!Array.isArray(result.succeeded)) {
      return false;
    }

    for (const success of result.succeeded) {
      const successCandidate = success as {
        operationId?: unknown;
        entityType?: unknown;
        id?: unknown;
        clientLocalId?: unknown;
      };
      if (
        typeof success !== 'object' ||
        typeof successCandidate.operationId !== 'string' ||
        !['list', 'recipe', 'chore'].includes(successCandidate.entityType as string) ||
        typeof successCandidate.id !== 'string'
      ) {
        return false;
      }

      if (
        successCandidate.clientLocalId !== undefined &&
        typeof successCandidate.clientLocalId !== 'string'
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Classify sync error to determine retry strategy.
 */
export function classifySyncError(error: unknown): ErrorClassification {
  if (error instanceof NetworkError) {
    return { type: 'RETRY', shouldIncrement: false };
  }

  if (error instanceof ApiError) {
    const status = error.statusCode;

    if (status === 401 || status === 403) {
      return { type: 'STOP_WORKER', reason: 'Authentication required' };
    }

    if (status >= 400 && status < 500) {
      return { type: 'RETRY', shouldIncrement: true };
    }

    if (status >= 500) {
      return { type: 'RETRY', shouldIncrement: true };
    }
  }

  return { type: 'RETRY', shouldIncrement: true };
}

