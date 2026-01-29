/**
 * useDashboardChores - Load today's chores and toggle completion for the dashboard.
 *
 * Uses the same data source as ChoresScreen (cache for signed-in, guest storage for guest)
 * so the list and toggle stay in sync. Returns today's chores only and a toggle handler.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Chore } from '../../../mocks/chores';
import { createChoresService } from '../../chores/services/choresService';
import { determineUserDataMode } from '../../../common/types/dataModes';
import { useCachedEntities } from '../../../common/hooks/useCachedEntities';
import { CacheAwareChoreRepository } from '../../../common/repositories/cacheAwareChoreRepository';
import { config } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';

function filterTodayChores(chores: Chore[]): Chore[] {
  return chores.filter((c) => c.section === 'today');
}

export interface UseDashboardChoresReturn {
  todayChores: Chore[];
  toggleChore: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useDashboardChores(): UseDashboardChoresReturn {
  const { user } = useAuth();

  const userMode = useMemo(() => {
    if (config.mockData.enabled) {
      return 'guest' as const;
    }
    return determineUserDataMode(user);
  }, [user]);

  const isSignedIn = userMode === 'signed-in';

  const choresService = useMemo(
    () => createChoresService(userMode),
    [userMode]
  );

  const repository = useMemo(() => {
    return isSignedIn ? new CacheAwareChoreRepository(choresService) : null;
  }, [choresService, isSignedIn]);

  const { data: cachedChores, isLoading: cacheLoading } =
    useCachedEntities<Chore>('chores');

  const [guestChores, setGuestChores] = useState<Chore[]>([]);
  const [guestLoading, setGuestLoading] = useState(true);

  const chores = isSignedIn ? cachedChores : guestChores;
  const isLoading = isSignedIn ? cacheLoading : guestLoading;

  const todayChores = useMemo(() => filterTodayChores(chores), [chores]);

  useEffect(() => {
    if (!isSignedIn) {
      let isMounted = true;
      const loadChores = async () => {
        try {
          const data = await choresService.getChores();
          if (isMounted) {
            setGuestChores(data);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Failed to load chores for dashboard:', error);
          }
        } finally {
          if (isMounted) {
            setGuestLoading(false);
          }
        }
      };
      loadChores();
      return () => {
        isMounted = false;
      };
    }
  }, [choresService, isSignedIn]);

  const toggleChore = useCallback(
    async (id: string) => {
      if (repository) {
        try {
          await repository.toggle(id);
        } catch (error) {
          console.error('Failed to toggle chore:', error);
        }
      } else {
        try {
          const updated = await choresService.toggleChore(id);
          setGuestChores((prev) =>
            prev.map((c) => (c.id === id ? updated : c))
          );
        } catch (error) {
          console.error('Failed to toggle chore:', error);
        }
      }
    },
    [repository, choresService]
  );

  return {
    todayChores,
    toggleChore,
    isLoading,
  };
}
