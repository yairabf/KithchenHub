/**
 * Represents a conflict that occurred during data synchronization.
 */
export interface SyncConflict {
  type: 'list' | 'recipe' | 'chore' | 'shoppingItem';
  id: string;
  operationId: string; // Idempotency key for precise matching
  reason: string;
}

/**
 * Result of a synchronization operation.
 */
export interface SyncResult {
  status: 'synced' | 'partial' | 'failed';
  conflicts: SyncConflict[];
  succeeded?: Array<{
    operationId: string;
    entityType: 'list' | 'recipe' | 'chore';
    id: string; // Server-assigned ID (serverId after sync)
    clientLocalId?: string; // Original localId from client (for create operations)
  }>;
}
