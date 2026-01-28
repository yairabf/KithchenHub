import type { SyncEntityType } from '../../cacheMetadata';
import type { QueueTargetId, QueuedWrite, QueuedWriteStatus, SyncCheckpoint } from './syncQueueStorage.types';
import { compactQueue, readQueue, writeQueue } from './syncQueueStorage.internal';
import { clearCheckpoint, confirmCheckpointOperationIds, getCheckpoint, markCheckpointAttempt, saveCheckpoint } from './syncQueueStorage.checkpointStorage';
import * as Crypto from 'expo-crypto';

export interface SyncQueueStorage {
  enqueue(
    entityType: SyncEntityType,
    op: 'create' | 'update' | 'delete',
    target: QueueTargetId,
    payload: unknown
  ): Promise<QueuedWrite>;
  getAll(): Promise<QueuedWrite[]>;
  getByEntityType(entityType: SyncEntityType): Promise<QueuedWrite[]>;
  getByTarget(entityType: SyncEntityType, localId: string): Promise<QueuedWrite[]>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  incrementRetry(id: string): Promise<void>;
  updateLastAttempt(id: string): Promise<void>;
  updateStatus(id: string, status: QueuedWriteStatus): Promise<void>;
  markAsFailedPermanent(id: string, error: string): Promise<void>;
  compact(): Promise<void>;
  getCheckpoint(): Promise<SyncCheckpoint | null>;
  saveCheckpoint(params: {
    inFlightOperationIds: string[];
    requestId: string;
    ttlMs?: number;
  }): Promise<SyncCheckpoint>;
  markCheckpointAttempt(): Promise<void>;
  confirmCheckpointOperationIds(confirmedOperationIds: string[]): Promise<void>;
  clearCheckpoint(): Promise<void>;
}

class SyncQueueStorageImpl implements SyncQueueStorage {
  private operationLock: Promise<void> = Promise.resolve();

  async enqueue(
    entityType: SyncEntityType,
    op: 'create' | 'update' | 'delete',
    target: QueueTargetId,
    payload: unknown
  ): Promise<QueuedWrite> {
    const queuedWriteId = Crypto.randomUUID();
    const operationId = Crypto.randomUUID();
    const clientTimestamp = new Date().toISOString();

    this.operationLock = this.operationLock.then(async () => {
      let queue = await readQueue();
      queue = compactQueue(queue);

      const queuedWrite: QueuedWrite = {
        id: queuedWriteId,
        operationId,
        entityType,
        op,
        target,
        payload,
        clientTimestamp,
        attemptCount: 0,
        status: 'PENDING',
      };

      queue.push(queuedWrite);
      queue = compactQueue(queue);
      await writeQueue(queue);
    });

    await this.operationLock;

    const queue = await readQueue();
    const createdItem = queue.find(
      item =>
        item.entityType === entityType &&
        item.target.localId === target.localId
    );

    if (!createdItem) {
      return {
        id: queuedWriteId,
        operationId,
        entityType,
        op,
        target,
        payload,
        clientTimestamp,
        attemptCount: 0,
        status: 'PENDING',
      };
    }

    return createdItem;
  }

  async getAll(): Promise<QueuedWrite[]> {
    return readQueue();
  }

  async getByEntityType(entityType: SyncEntityType): Promise<QueuedWrite[]> {
    const queue = await readQueue();
    return queue.filter(item => item.entityType === entityType);
  }

  async getByTarget(entityType: SyncEntityType, localId: string): Promise<QueuedWrite[]> {
    const queue = await readQueue();
    return queue.filter(
      item => item.entityType === entityType && item.target.localId === localId
    );
  }

  async remove(id: string): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const filtered = queue.filter(item => item.id !== id);
      if (filtered.length === queue.length) {
        return;
      }
      await writeQueue(filtered);
    });
    await this.operationLock;
  }

  async clear(): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      await writeQueue([]);
    });
    await this.operationLock;
  }

  private async updateQueueItem(
    id: string,
    updater: (item: QueuedWrite) => QueuedWrite
  ): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const updated = queue.map(item => item.id === id ? updater(item) : item);
      await writeQueue(updated);
    });
    await this.operationLock;
  }

  async incrementRetry(id: string): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      attemptCount: item.attemptCount + 1,
      lastAttemptAt: new Date().toISOString(),
      status: 'RETRYING' as QueuedWriteStatus,
    }));
  }

  async updateLastAttempt(id: string): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      lastAttemptAt: new Date().toISOString(),
    }));
  }

  async updateStatus(id: string, status: QueuedWriteStatus): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      status,
    }));
  }

  async markAsFailedPermanent(id: string, error: string): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      status: 'FAILED_PERMANENT' as QueuedWriteStatus,
      lastError: error,
      lastAttemptAt: new Date().toISOString(),
    }));
  }

  async compact(): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const compacted = compactQueue(queue);
      if (compacted.length !== queue.length) {
        await writeQueue(compacted);
      }
    });
    await this.operationLock;
  }

  async getCheckpoint(): Promise<SyncCheckpoint | null> {
    return getCheckpoint();
  }

  async saveCheckpoint(params: {
    inFlightOperationIds: string[];
    requestId: string;
    ttlMs?: number;
  }): Promise<SyncCheckpoint> {
    this.operationLock = this.operationLock.then(async () => {
      await saveCheckpoint(params);
    });
    await this.operationLock;
    const checkpoint = await getCheckpoint();
    if (!checkpoint) {
      throw new Error('Checkpoint was not found after saveCheckpoint operation.');
    }
    return checkpoint;
  }

  async markCheckpointAttempt(): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      await markCheckpointAttempt();
    });
    await this.operationLock;
  }

  async confirmCheckpointOperationIds(confirmedOperationIds: string[]): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      await confirmCheckpointOperationIds(confirmedOperationIds);
    });
    await this.operationLock;
  }

  async clearCheckpoint(): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      await clearCheckpoint();
    });
    await this.operationLock;
  }
}

export const syncQueueStorage: SyncQueueStorage = new SyncQueueStorageImpl();

