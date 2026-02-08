/**
 * useSyncQueue Hook
 *
 * Manages the sync worker so POST /auth/sync is only called when there is something to sync.
 *
 * Why does auth/sync get called?
 * - The worker runs when the app is online and either (1) just came to foreground, or (2) network
 *   just came back online, or (3) something was just enqueued (create/update/delete).
 * - It only sends a request when the sync queue has items (pending creates/updates/deletes).
 * - So if you "keep" seeing sync requests, the queue has items that are being sent (and possibly
 *   retried if the backend doesn't confirm them in the response).
 *
 * We only start the worker when the queue actually has items (or when we don't know yet), so
 * opening the app with nothing to sync does not hit the backend.
 */

import { useEffect, useRef } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { getSyncQueueProcessor } from '../utils/syncQueueProcessor';
import { syncQueueStorage } from '../utils/syncQueueStorage';
import { useAppLifecycle } from '../../contexts/AppLifecycleContext';

/**
 * Starts the sync worker only if the queue has items (so we don't hit the backend when empty).
 */
async function startWorkerIfQueueHasItems(
  processor: ReturnType<typeof getSyncQueueProcessor>
): Promise<void> {
  if (processor.isRunning()) return;
  const queue = await syncQueueStorage.getAll();
  if (queue.length === 0) return;
  if (__DEV__) {
    console.log(`[SyncQueue] Queue has ${queue.length} item(s) → starting sync worker`);
  }
  processor.start();
}

export function useSyncQueue(): void {
  const { isOffline } = useNetwork();
  const { isForeground } = useAppLifecycle();
  const processorRef = useRef<ReturnType<typeof getSyncQueueProcessor> | null>(null);
  const lastOfflineStateRef = useRef<boolean | null>(null);
  const lastForegroundStateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = getSyncQueueProcessor();
    }
  }, []);

  // Start worker only when queue has items; stop when offline
  useEffect(() => {
    if (!processorRef.current) return;

    const isNowOnline = !isOffline;
    lastOfflineStateRef.current = isOffline;

    if (isNowOnline && !processorRef.current.isRunning()) {
      startWorkerIfQueueHasItems(processorRef.current);
    } else if (isOffline && processorRef.current.isRunning()) {
      if (__DEV__) console.log('[SyncQueue] Network offline → stopping sync worker');
      processorRef.current.stop();
    }
  }, [isOffline]);

  // On foreground + online, start worker only if queue has items
  useEffect(() => {
    if (!processorRef.current) return;

    const wasBackground = !lastForegroundStateRef.current;
    const isNowForeground = isForeground;
    lastForegroundStateRef.current = isForeground;

    if (wasBackground && isNowForeground && !isOffline && !processorRef.current.isRunning()) {
      startWorkerIfQueueHasItems(processorRef.current);
    } else if (!isNowForeground && processorRef.current.isRunning()) {
      if (__DEV__) console.log('[SyncQueue] App background → stopping sync worker');
      processorRef.current.stop();
    }
  }, [isForeground, isOffline]);

  // Cleanup: stop worker on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current?.isRunning()) {
        processorRef.current.stop();
      }
    };
  }, []);
}
