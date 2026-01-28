import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildCheckpointStorageKey, getStoredSignedInUser, removeOperationIdsFromCheckpoint, validateCheckpointShape } from './syncQueueStorage.internal';
import type { SyncCheckpoint } from './syncQueueStorage.types';
import { DEFAULT_CHECKPOINT_TTL_MS } from './syncQueueStorage.constants';
import * as Crypto from 'expo-crypto';

export async function getCheckpoint(): Promise<SyncCheckpoint | null> {
  const user = await getStoredSignedInUser();
  const storageKey = buildCheckpointStorageKey(user?.id);

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    const checkpoint = validateCheckpointShape(parsed);
    if (!checkpoint) {
      await AsyncStorage.removeItem(storageKey);
      return null;
    }

    if (user && checkpoint.userId !== user.id) {
      await AsyncStorage.removeItem(storageKey);
      return null;
    }

    return checkpoint;
  } catch {
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    return null;
  }
}

export async function saveCheckpoint(params: {
  inFlightOperationIds: string[];
  requestId: string;
  ttlMs?: number;
}): Promise<SyncCheckpoint> {
  const user = await getStoredSignedInUser();
  const storageKey = buildCheckpointStorageKey(user?.id);

  const checkpoint: SyncCheckpoint = {
    checkpointId: Crypto.randomUUID(),
    userId: user?.id ?? 'unknown-user',
    householdId: user?.householdId,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    ttlMs: params.ttlMs ?? DEFAULT_CHECKPOINT_TTL_MS,
    requestId: params.requestId,
    inFlightOperationIds: [...params.inFlightOperationIds],
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(checkpoint));
  return checkpoint;
}

export async function markCheckpointAttempt(): Promise<void> {
  const user = await getStoredSignedInUser();
  const storageKey = buildCheckpointStorageKey(user?.id);

  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) {
    return;
  }
  const parsed = JSON.parse(raw) as unknown;
  const checkpoint = validateCheckpointShape(parsed);
  if (!checkpoint) {
    await AsyncStorage.removeItem(storageKey);
    return;
  }
  const updated: SyncCheckpoint = {
    ...checkpoint,
    attemptCount: checkpoint.attemptCount + 1,
    lastAttemptAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
}

export async function confirmCheckpointOperationIds(confirmedOperationIds: string[]): Promise<void> {
  const user = await getStoredSignedInUser();
  const storageKey = buildCheckpointStorageKey(user?.id);

  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) {
    return;
  }
  const parsed = JSON.parse(raw) as unknown;
  const checkpoint = validateCheckpointShape(parsed);
  if (!checkpoint) {
    await AsyncStorage.removeItem(storageKey);
    return;
  }

  const updated = removeOperationIdsFromCheckpoint(checkpoint, confirmedOperationIds);
  if (updated.inFlightOperationIds.length === 0) {
    await AsyncStorage.removeItem(storageKey);
    return;
  }
  await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
}

export async function clearCheckpoint(): Promise<void> {
  const user = await getStoredSignedInUser();
  const storageKey = buildCheckpointStorageKey(user?.id);
  await AsyncStorage.removeItem(storageKey);
}

