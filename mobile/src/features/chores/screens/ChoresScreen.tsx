import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChoresScreen.tsx:312',message:'ChoresScreen platform info',data:{platform:Platform.OS,isWideScreen:isWideScreen,platformVersion:Platform.Version},timestamp:Date.now(),hypothesisId:'H'})}).catch(()=>{});
  }, []);
  // #endregion

  return (
    <SafeAreaView style={styles.container}
      onLayout={(e) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChoresScreen.tsx:313',message:'ChoresScreen SafeAreaView layout',data:{layout:e.nativeEvent.layout},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }}
    >
      <View style={styles.header} >
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
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentInset={Platform.OS === 'ios' ? {top: 0, bottom: 0, left: 0, right: 0} : undefined}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isWideScreen ? (
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
                onLayout={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChoresScreen.tsx:400',message:'Upcoming sectionHeader layout (wide)',data:{layout:e.nativeEvent.layout},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                }}
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
