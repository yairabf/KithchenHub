/**
 * useSyncQueue Hook
 * 
 * React hook that manages sync worker loop based on network status and app lifecycle.
 * Automatically starts/stops worker loop when network comes back online or app comes to foreground.
 */

import { useEffect, useRef } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { getSyncQueueProcessor } from '../utils/syncQueueProcessor';
import { useAppLifecycle } from '../../contexts/AppLifecycleContext';

/**
 * Hook that manages sync worker loop
 * 
 * Automatically starts worker loop when:
 * - Network status changes from offline to online
 * - App comes to foreground (if online)
 * 
 * Automatically stops worker loop when:
 * - Network goes offline
 * - App goes to background
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

  // Start/stop worker loop based on network status
  useEffect(() => {
    if (!processorRef.current) return;

    const wasOffline = lastOfflineStateRef.current;
    const isNowOnline = !isOffline;

    // Track offline state
    lastOfflineStateRef.current = isOffline;

    if (isNowOnline && !processorRef.current.isRunning()) {
      // Network came back online - start worker loop
      console.log('Network came back online, starting sync worker');
      processorRef.current.start();
    } else if (isOffline && processorRef.current.isRunning()) {
      // Network went offline - stop worker loop
      console.log('Network went offline, stopping sync worker');
      processorRef.current.stop();
    }
  }, [isOffline]);

  // Start/stop worker based on app foreground/background
  useEffect(() => {
    if (!processorRef.current) return;

    const wasBackground = !lastForegroundStateRef.current;
    const isNowForeground = isForeground;

    lastForegroundStateRef.current = isForeground;

    if (wasBackground && isNowForeground && !isOffline && !processorRef.current.isRunning()) {
      // App came to foreground and online - start worker
      console.log('App came to foreground, starting sync worker');
      processorRef.current.start();
    } else if (!isNowForeground && processorRef.current.isRunning()) {
      // App went to background - stop worker (RN timers unreliable in background)
      console.log('App went to background, stopping sync worker');
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
