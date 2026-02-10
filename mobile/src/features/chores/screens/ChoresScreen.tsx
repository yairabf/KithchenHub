import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  GestureResponderEvent,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '../../../theme';
import { ProgressRing } from '../components/ProgressRing';
import { SwipeableWrapper } from '../../../common/components/SwipeableWrapper';
import { ListItemCardWrapper } from '../../../common/components/ListItemCardWrapper';
import { ChoreDetailsModal } from '../components/ChoreDetailsModal';
import { ShareModal } from '../../../common/components/ShareModal';
import { formatChoresText } from '../../../common/utils/shareUtils';
import { type Chore } from '../../../mocks/chores';
import { styles } from './styles';
import type { ChoresScreenProps } from './types';
import { createChore } from '../utils/choreFactory';
import { createChoresService } from '../services/choresService';
import { config } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';
import { determineUserDataMode } from '../../../common/types/dataModes';
import { useCachedEntities } from '../../../common/hooks/useCachedEntities';
import { CacheAwareChoreRepository } from '../../../common/repositories/cacheAwareChoreRepository';

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
          console.log('[ChoresScreen] Cache check completed, chores:', chores.length);
        })
        .catch((error) => {
          console.error('[ChoresScreen] Failed to check cache:', error);
        });
    }
  }, [isSignedIn, repository]);

  const handleRefresh = async () => {
    if (!repository) return;
    setIsRefreshing(true);
    try {
      await repository.refresh();
    } catch (error) {
      console.error('Failed to refresh chores:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load chores for guest mode
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
            console.error('Failed to load chores:', error);
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
        console.error('Failed to toggle chore:', error);
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
        console.error('Failed to update chore assignee:', error);
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
        console.error('Failed to update chore:', error);
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
        console.error('Failed to delete chore:', error);
      }
    } else {
      // Guest: update local state
      setGuestChores(prevChores => prevChores.filter(chore => chore.id !== choreId));
    }
  };

  const handleAddChore = async (newChore: {
    title: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => {
    if (repository) {
      // Signed-in: use repository
      try {
        await repository.create(newChore);
      } catch (error) {
        console.error('Failed to create chore:', error);
      }
    } else {
      // Guest: update local state
      const chore = createChore(newChore);
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
    
    // #region agent log
    console.log('[ChoresScreen] Progress calculated:', {
      total,
      completed: completedCount,
      progressValue,
      todayChores: todayChores.map(c => ({ title: c.title, isCompleted: c.isCompleted }))
    });
    // #endregion
    return progressValue;
  }, [todayChores]);

  /**
   * Chore Card Component
   * Renders a single chore item with swipe-to-delete and edit functionality
   */
  const ChoreCard = React.memo(({ chore, bgColor }: { chore: Chore; bgColor: string }) => {
    const handleEditPress = (e: GestureResponderEvent) => {
      e.stopPropagation();
      handleChorePress(chore);
    };

    return (
      <SwipeableWrapper
        key={chore.id}
        onSwipeDelete={() => handleDeleteChore(chore.id)}
        borderRadius={borderRadius.xxl}
      >
        <ListItemCardWrapper
          backgroundColor={bgColor}
          onPress={() => toggleChore(chore.id)}
          testID={`chore-card-${chore.id}`}
        >
          <View style={styles.choreCard}>
            <TouchableOpacity
              style={styles.choreCardEditButton}
              onPress={handleEditPress}
              activeOpacity={0.6}
            >
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.choreCardIcon}>
              <Text style={styles.choreCardIconText}>{chore.icon || '📋'}</Text>
            </View>
            <View style={styles.choreCardContent}>
              <Text
                style={[styles.choreCardName, chore.isCompleted && styles.choreCompleted]}
                numberOfLines={1}
              >
                {chore.title}
              </Text>
              <Text style={styles.choreCardTime} numberOfLines={1}>
                {chore.dueDate} {chore.dueTime}
              </Text>
            </View>
            {chore.assignee && (
              <View style={styles.choreCardAssignee}>
                <Text style={styles.choreCardAssigneeText} numberOfLines={1}>
                  {chore.assignee}
                </Text>
              </View>
            )}
            <View style={styles.choreCardCheck}>
              {chore.isCompleted ? (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                </View>
              ) : (
                <View style={styles.uncheckmark} />
              )}
            </View>
          </View>
        </ListItemCardWrapper>
      </SwipeableWrapper>
    );
  });

  const renderChoreCard = (chore: Chore) => (
    <ChoreCard key={chore.id} chore={chore} bgColor={colors.surface} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>Household Hub</Text>
          <Text style={styles.headerTitle}>Chores Dashboard</Text>
          <View style={styles.headerMeta}>
            <Ionicons name="clipboard-outline" size={16} color={colors.textMuted} />
            <Text style={styles.headerMetaText}>
              {remainingToday} tasks remaining for today
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityLabel="Share chores list"
            style={styles.headerIconButton}
            onPress={() => setShowShareModal(true)}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          {onOpenChoresModal && (
            <TouchableOpacity
              accessibilityLabel="Assign chore"
              style={styles.headerPrimaryButton}
              onPress={onOpenChoresModal}
            >
              <Ionicons name="add" size={20} color={colors.textLight} />
              <Text style={styles.headerPrimaryButtonText}>Assign Chore</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isWideScreen ? (
          // Two-column layout for tablets/landscape
          <View style={styles.wideLayout}>
            {/* Left column: Progress + Today */}
            <View style={styles.leftColumn}>
              {/* Progress Card */}
              <View style={styles.progressCard}>
                <View style={styles.progressRow}>
                  <View style={styles.progressRingWrap}>
                    <ProgressRing progress={progress} size={160} showPercentage={false} showEmoji={false} />
                    <View style={styles.progressRingText}>
                      <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                      <Text style={styles.progressLabel}>Today</Text>
                    </View>
                  </View>
                  <View style={styles.progressDetails}>
                    <Text style={styles.progressTitle}>Daily Progress</Text>
                    <Text style={styles.progressBody}>
                      You've completed {completedToday} out of {todayChores.length} chores today. Keep it up to reach your weekly goals!
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.searchContainer}>
                <Text style={styles.searchPlaceholder}>Quick find tasks...</Text>
                <Ionicons name="search" size={20} color={colors.primary} />
              </View>

              {/* Today's Chores */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIndicator} />
                  <Text style={styles.sectionTitle}>Today's Chores</Text>
                </View>
                {todayChores.length > 0 && (
                  <View style={styles.choreList}>
                    {todayChores.map(renderChoreCard)}
                  </View>
                )}
              </View>
            </View>

            {/* Right column: Upcoming */}
            <View style={styles.rightColumn}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIndicator, styles.sectionIndicatorAlt]} />
                  <Text style={styles.sectionTitle}>Upcoming Chores</Text>
                </View>
                {upcomingChores.length > 0 && (
                  <View style={styles.choreList}>
                    {upcomingChores.map(renderChoreCard)}
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          // Single-column layout for phones
          <View style={styles.narrowLayout}>
            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={[styles.progressRow, styles.progressRowPhone]}>
                <View style={styles.progressRingWrap}>
                  <ProgressRing progress={progress} size={140} showPercentage={false} showEmoji={false} />
                  <View style={styles.progressRingText}>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                    <Text style={styles.progressLabel}>Today</Text>
                  </View>
                </View>
                <View style={[styles.progressDetails, styles.progressDetailsPhone]}>
                  <Text style={styles.progressTitle}>Daily Progress</Text>
                  <Text style={[styles.progressBody, styles.progressBodyPhone]}>
                    You've completed {completedToday} out of {todayChores.length} chores today. Keep it up to reach your weekly goals!
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchPlaceholder}>Quick find tasks...</Text>
              <Ionicons name="search" size={20} color={colors.primary} />
            </View>

            {/* Today's Chores */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitle}>Today's Chores</Text>
              </View>
              {todayChores.length > 0 && (
                <View style={styles.choreList}>
                  {todayChores.map(renderChoreCard)}
                </View>
              )}
            </View>

            {/* Upcoming Chores */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIndicator, styles.sectionIndicatorAlt]} />
                <Text style={styles.sectionTitle}>Upcoming Chores</Text>
              </View>
              {upcomingChores.length > 0 && (
                <View style={styles.choreList}>
                  {upcomingChores.map(renderChoreCard)}
                </View>
              )}
            </View>
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
