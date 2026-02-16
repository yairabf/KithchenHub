import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { ChoreCard } from '../components/ChoreCard';
import { ChoresProgressCard } from '../components/ChoresProgressCard';
import { ChoresSection } from '../components/ChoresSection';
import { ChoreDetailsModal } from '../components/ChoreDetailsModal';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { ShareModal } from '../../../common/components/ShareModal';
import { EmptyState } from '../../../common/components/EmptyState';
import { ListItemSkeleton } from '../../../common/components/ListItemSkeleton';
import { formatChoresText } from '../../../common/utils/shareUtils';
import { type Chore } from '../../../mocks/chores';
import { styles } from './styles';
import type { ChoresScreenProps, AddChoreHandler } from './types';
import { createChore } from '../utils/choreFactory';
import { createChoresService } from '../services/choresService';
import { config } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';
import { determineUserDataMode } from '../../../common/types/dataModes';
import { useCachedEntities } from '../../../common/hooks/useCachedEntities';
import { CacheAwareChoreRepository } from '../../../common/repositories/cacheAwareChoreRepository';
import { logger } from '../../../common/utils/logger';

export function ChoresScreen({ onOpenChoresModal, onRegisterAddChoreHandler }: ChoresScreenProps) {
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  // Determine data mode based on user authentication state
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

  // Use cache hook for signed-in users
  const { data: cachedChores } = useCachedEntities<Chore>('chores');

  // For guest mode, use service directly
  const [guestChores, setGuestChores] = useState<Chore[]>([]);
  const [isLoadingChores, setIsLoadingChores] = useState(true);

  const chores = (isSignedIn ? cachedChores : guestChores)
    .filter(c => !c.deletedAt);

  // For signed-in users, trigger initial fetch ONLY on first login (when cache is missing)
  // Subsequent navigations will use cache (no API calls)
  // Note: findAll() will only fetch from API if cache is missing, otherwise returns cache
  useEffect(() => {
    if (isSignedIn && repository) {
      // Check cache - only fetches from API if cache is missing
      repository.findAll()
        .then((chores) => {
          logger.debug('[ChoresScreen] Cache check completed, chores:', chores.length);
          setIsLoadingChores(false);
        })
        .catch((error) => {
          logger.error('[ChoresScreen] Failed to check cache:', error instanceof Error ? error : String(error));
          setIsLoadingChores(false);
        });
    } else if (!isSignedIn) {
      setIsLoadingChores(false);
    }
  }, [isSignedIn, repository]);

  const handleRefresh = async () => {
    if (!repository) return;
    setIsRefreshing(true);
    try {
      await repository.refresh();
    } catch (error) {
      logger.error('Failed to refresh chores:', error instanceof Error ? error : String(error));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load chores for guest mode
  useEffect(() => {
    if (!isSignedIn) {
      let isMounted = true;
      setIsLoadingChores(true);
      const loadChores = async () => {
        try {
          const data = await choresService.getChores();
          if (isMounted) {
            setGuestChores(data);
            setIsLoadingChores(false);
          }
        } catch (error) {
          if (isMounted) {
            logger.error('Failed to load chores:', error instanceof Error ? error : String(error));
            setIsLoadingChores(false);
          }
        }
      };
      loadChores();
      return () => { isMounted = false; };
    }
  }, [choresService, isSignedIn]);

  // Responsive breakpoint: tablet/landscape at 768px+
  const isWideScreen = width >= 768;

  const toggleChore = async (id: string) => {
    if (repository) {
      // Signed-in: use repository (cache events will update UI)
      try {
        await repository.toggle(id);
      } catch (error) {
        logger.error('Failed to toggle chore:', error instanceof Error ? error : String(error));
      }
    } else {
      // Guest: update local state
      setGuestChores(prevChores => prevChores.map(chore =>
        chore.id === id ? { ...chore, isCompleted: !chore.isCompleted } : chore
      ));
    }
  };

  const handleChorePress = (chore: Chore) => {
    setSelectedChore(chore);
    setShowDetailsModal(true);
  };

  const handleUpdateAssignee = async (choreId: string, assignee: string | undefined) => {
    if (repository) {
      // Signed-in: use repository
      try {
        await repository.update(choreId, { assignee });
      } catch (error) {
        logger.error('Failed to update chore assignee:', error instanceof Error ? error : String(error));
      }
    } else {
      // Guest: update local state
      setGuestChores(prevChores => prevChores.map(chore =>
        chore.id === choreId ? { ...chore, assignee } : chore
      ));
    }
  };

  const handleUpdateChore = async (choreId: string, updates: Partial<Chore>) => {
    if (repository) {
      // Signed-in: use repository
      try {
        await repository.update(choreId, updates);
      } catch (error) {
        logger.error('Failed to update chore:', error instanceof Error ? error : String(error));
      }
    } else {
      // Guest: update local state
      setGuestChores(prevChores => prevChores.map(chore =>
        chore.id === choreId ? { ...chore, ...updates } : chore
      ));
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    if (repository) {
      // Signed-in: use repository
      try {
        await repository.delete(choreId);
      } catch (error) {
        logger.error('Failed to delete chore:', error instanceof Error ? error : String(error));
      }
    } else {
      // Guest: update local state
      setGuestChores(prevChores => prevChores.filter(chore => chore.id !== choreId));
    }
  };

  const handleAddChore: AddChoreHandler = async (newChore) => {
    const chorePayload = { ...newChore, title: newChore.name };
    if (repository) {
      try {
        await repository.create(chorePayload);
      } catch (error) {
        logger.error('Failed to create chore:', error instanceof Error ? error : String(error));
      }
    } else {
      const chore = createChore(chorePayload);
      setGuestChores(prevChores => [...prevChores, chore]);
    }
  };

  // Register the handler with parent on mount
  useEffect(() => {
    if (onRegisterAddChoreHandler) {
      onRegisterAddChoreHandler(handleAddChore);
    }
  }, [onRegisterAddChoreHandler]);

  const todayChores = chores.filter(c => c.section === 'today');
  const upcomingChores = chores.filter(c => c.section === 'thisWeek' || c.section === 'recurring');
  const remainingToday = todayChores.filter(c => !c.isCompleted).length;
  const completedToday = todayChores.filter(c => c.isCompleted).length;

  // Format chores for sharing using centralized formatter
  const shareText = useMemo(
    () => formatChoresText(todayChores, upcomingChores),
    [todayChores, upcomingChores]
  );

  // Calculate progress (only for today's chores)
  const progress = useMemo(() => {
    const total = todayChores.length;
    const completedCount = todayChores.filter(c => c.isCompleted).length;
    const progressValue = total > 0 ? (completedCount / total) * 100 : 0;

    return progressValue;
  }, [todayChores]);

  const renderChoreCard = (chore: Chore) => (
    <ChoreCard
      key={chore.id}
      chore={chore}
      bgColor={colors.surface}
      onToggle={toggleChore}
      onEdit={handleChorePress}
      onDelete={handleDeleteChore}
    />
  );

  const headerActions = {
    share: { onPress: () => setShowShareModal(true), label: 'Share chores list' },
    ...(onOpenChoresModal && { add: { onPress: onOpenChoresModal, label: 'Add item' } as const }),
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Home Chores"
        titleIcon="checkbox-outline"
        rightActions={headerActions}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentInset={Platform.OS === 'ios' ? {top: 0, bottom: 0, left: 0, right: 0} : undefined}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoadingChores ? (
          <View style={styles.narrowLayout}>
            {Array.from({ length: 5 }).map((_, index) => (
              <ListItemSkeleton key={index} />
            ))}
          </View>
        ) : chores.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="No chores yet"
            description="Create your first chore to start tracking household tasks"
            actionLabel="Create first chore"
            onActionPress={onOpenChoresModal}
            actionColor={colors.chores}
          />
        ) : isWideScreen ? (
          <View style={styles.wideLayout}>
            <View style={styles.leftColumn}>
              <ChoresProgressCard
                progress={progress}
                completedCount={completedToday}
                totalCount={todayChores.length}
                isWideScreen={true}
              />
              <View style={styles.searchContainer}>
                <Text style={styles.searchPlaceholder}>Quick find tasks...</Text>
                <Ionicons name="search" size={20} color={colors.primary} />
              </View>
              <ChoresSection
                title="Today's Chores"
                chores={todayChores}
                indicatorColor="primary"
                renderChoreCard={renderChoreCard}
              />
            </View>
            <View style={styles.rightColumn}>
              <ChoresSection
                title="Upcoming Chores"
                chores={upcomingChores}
                indicatorColor="secondary"
                renderChoreCard={renderChoreCard}
              />
            </View>
          </View>
        ) : (
          <View style={styles.narrowLayout}>
            <ChoresProgressCard
              progress={progress}
              completedCount={completedToday}
              totalCount={todayChores.length}
              isWideScreen={false}
            />
            <View style={styles.searchContainer}>
              <Text style={styles.searchPlaceholder}>Quick find tasks...</Text>
              <Ionicons name="search" size={20} color={colors.primary} />
            </View>
            <ChoresSection
              title="Today's Chores"
              chores={todayChores}
              indicatorColor="primary"
              renderChoreCard={renderChoreCard}
            />
            <ChoresSection
              title="Upcoming Chores"
              chores={upcomingChores}
              indicatorColor="secondary"
              renderChoreCard={renderChoreCard}
            />
          </View>
        )}
      </ScrollView>

      {/* Chore Details Modal */}
      <ChoreDetailsModal
        visible={showDetailsModal}
        chore={selectedChore}
        onClose={() => setShowDetailsModal(false)}
        onUpdateAssignee={handleUpdateAssignee}
        onUpdateChore={handleUpdateChore}
      />

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Chores"
        shareText={shareText}
      />
    </SafeAreaView>
  );
}

// Re-export type for use in parent components
export type { AddChoreHandler } from './types';
