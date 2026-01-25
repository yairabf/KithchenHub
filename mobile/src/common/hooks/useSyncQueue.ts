/**
 * useSyncQueue Hook
 * 
 * React hook that processes sync queue when network comes back online.
 * Automatically triggers queue processing on network status changes.
 */

import { useEffect, useRef } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { getSyncQueueProcessor } from '../utils/syncQueueProcessor';
import { useAppLifecycle } from '../../contexts/AppLifecycleContext';

/**
 * Hook that processes sync queue when network comes back online
 * 
 * Automatically processes queue when:
 * - Network status changes from offline to online
 * - App comes to foreground (if online)
 * 
 * @example
 * ```typescript
 * // In MainNavigator or App root component
 * useSyncQueue();
 * ```
 */
export function useSyncQueue(): void {
  const { isOffline } = useNetwork();
  const { isForeground } = useAppLifecycle();
  const processorRef = useRef<ReturnType<typeof getSyncQueueProcessor> | null>(null);
  const lastOfflineStateRef = useRef<boolean | null>(null);
  const lastForegroundStateRef = useRef<boolean>(false);

  // Initialize processor
  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = getSyncQueueProcessor();
    }
  }, []);

  // Process queue when network comes back online
  useEffect(() => {
    const wasOffline = lastOfflineStateRef.current;
    const isNowOnline = !isOffline;

    // Track offline state
    lastOfflineStateRef.current = isOffline;

    // If we were offline and are now online, process queue
    if (wasOffline === true && isNowOnline && processorRef.current) {
      console.log('Network came back online, processing sync queue');
      processorRef.current.processQueue().catch((error) => {
        console.error('Failed to process sync queue:', error);
      });
    }
  }, [isOffline]);

  // Process queue when app comes to foreground (if online)
  useEffect(() => {
    const wasBackground = !lastForegroundStateRef.current;
    const isNowForeground = isForeground;

    // Track foreground state
    lastForegroundStateRef.current = isForeground;

    // If app came to foreground and we're online, process queue
    if (wasBackground && isNowForeground && !isOffline && processorRef.current) {
      console.log('App came to foreground, processing sync queue');
      processorRef.current.processQueue().catch((error) => {
        console.error('Failed to process sync queue:', error);
      });
    }
  }, [isForeground, isOffline]);
}
