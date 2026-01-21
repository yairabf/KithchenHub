/**
 * Represents a conflict that occurred during data synchronization.
 */
export interface SyncConflict {
  type: 'list' | 'recipe' | 'chore';
  id: string;
  reason: string;
}

/**
 * Result of a synchronization operation.
 */
export interface SyncResult {
  status: 'synced' | 'partial' | 'failed';
  conflicts: SyncConflict[];
}
