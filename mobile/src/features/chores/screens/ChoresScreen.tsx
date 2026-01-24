import React, { useState, useMemo, useEffect } from 'react';
import * as Crypto from 'expo-crypto';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, pastelColors } from '../../../theme';
import { ProgressRing } from '../components/ProgressRing';
import { SwipeableWrapper } from '../../../common/components/SwipeableWrapper';
import { ChoreDetailsModal } from '../components/ChoreDetailsModal';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
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

export function ChoresScreen({ onOpenChoresModal, onRegisterAddChoreHandler }: ChoresScreenProps) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  
  // Determine data mode based on user authentication state
  const userMode = useMemo(() => {
    if (config.mockData.enabled) {
      return 'guest' as const;
    }
    return determineUserDataMode(user);
  }, [user]);
  
  const choresService = useMemo(
    () => createChoresService(userMode),
    [userMode]
  );

  useEffect(() => {
    let isMounted = true;

    const loadChores = async () => {
      try {
        const data = await choresService.getChores();
        if (isMounted) {
          setChores(data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load chores:', error);
        }
      }
    };

    loadChores();

    return () => {
      isMounted = false;
    };
  }, [choresService]);

  // Responsive breakpoint: tablet/landscape at 768px+
  const isWideScreen = width >= 768;

  const toggleChore = (id: string) => {
    setChores(prevChores => prevChores.map(chore =>
      chore.id === id ? { ...chore, completed: !chore.completed } : chore
    ));
  };

  const handleChorePress = (chore: Chore) => {
    setSelectedChore(chore);
    setShowDetailsModal(true);
  };

  const handleUpdateAssignee = (choreId: string, assignee: string | undefined) => {
    setChores(prevChores => prevChores.map(chore =>
      chore.id === choreId ? { ...chore, assignee } : chore
    ));
  };

  const handleUpdateChore = (choreId: string, updates: Partial<Chore>) => {
    setChores(prevChores => prevChores.map(chore =>
      chore.id === choreId ? { ...chore, ...updates } : chore
    ));
  };

  const handleDeleteChore = (choreId: string) => {
    setChores(prevChores => prevChores.filter(chore => chore.id !== choreId));
  };

  const handleAddChore = (newChore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => {
    const chore = createChore(newChore);
    setChores(prevChores => [...prevChores, chore]);
  };

  // Register the handler with parent on mount
  useEffect(() => {
    if (onRegisterAddChoreHandler) {
      onRegisterAddChoreHandler(handleAddChore);
    }
  }, [onRegisterAddChoreHandler]);

  const todayChores = chores.filter(c => c.section === 'today');
  const upcomingChores = chores.filter(c => c.section === 'thisWeek' || c.section === 'recurring');

  // Format chores for sharing using centralized formatter
  const shareText = useMemo(
    () => formatChoresText(todayChores, upcomingChores),
    [todayChores, upcomingChores]
  );

  // Header actions configuration
  const headerActions = useMemo(() => ({
    share: {
      onPress: () => setShowShareModal(true),
      label: 'Share chores list'
    },
    ...(onOpenChoresModal && {
      add: {
        onPress: onOpenChoresModal,
        label: 'Add new chore'
      }
    })
  }), [onOpenChoresModal]);

  // Calculate progress (only for today's chores)
  const progress = useMemo(() => {
    const total = todayChores.length;
    const completed = todayChores.filter(c => c.completed).length;
    const progressValue = total > 0 ? (completed / total) * 100 : 0;
    // #region agent log
    console.log('[ChoresScreen] Progress calculated:', {
      total,
      completed,
      progressValue,
      todayChores: todayChores.map(c => ({ name: c.name, completed: c.completed }))
    });
    // #endregion
    return progressValue;
  }, [todayChores]);

  const renderChoreCard = (chore: Chore, index: number) => {
    const bgColor = pastelColors[index % pastelColors.length];

    const handleEditPress = (e: any) => {
      e.stopPropagation();
      handleChorePress(chore);
    };

    return (
      <SwipeableWrapper
        key={chore.id}
        onSwipeDelete={() => handleDeleteChore(chore.id)}
        backgroundColor={bgColor}
      >
        <TouchableOpacity
          style={styles.choreCard}
          onPress={() => toggleChore(chore.id)}
          activeOpacity={0.7}
        >
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
              style={[styles.choreCardName, chore.completed && styles.choreCompleted]}
              numberOfLines={1}
            >
              {chore.name}
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
            {chore.completed ? (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={18} color={colors.success} />
              </View>
            ) : (
              <View style={styles.uncheckmark} />
            )}
          </View>
        </TouchableOpacity>
      </SwipeableWrapper>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="HOME CHORES"
        rightActions={headerActions}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isWideScreen ? (
          // Two-column layout for tablets/landscape
          <View style={styles.wideLayout}>
            {/* Left column: Progress + Today */}
            <View style={styles.leftColumn}>
              {/* Progress Card */}
              <View style={styles.progressCard}>
                <ProgressRing progress={progress} size={160} />
              </View>

              {/* Today's Chores */}
              {todayChores.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>TODAY'S CHORES</Text>
                  <View style={styles.choreList}>
                    {todayChores.map(renderChoreCard)}
                  </View>
                </View>
              )}
            </View>

            {/* Right column: Upcoming */}
            <View style={styles.rightColumn}>
              {upcomingChores.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>UPCOMING CHORES</Text>
                  <View style={styles.choreList}>
                    {upcomingChores.map(renderChoreCard)}
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          // Single-column layout for phones
          <View style={styles.narrowLayout}>
            {/* Progress Card */}
            <View style={styles.progressCard}>
              <ProgressRing progress={progress} size={140} />
            </View>

            {/* Today's Chores */}
            {todayChores.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TODAY'S CHORES</Text>
                <View style={styles.choreList}>
                  {todayChores.map(renderChoreCard)}
                </View>
              </View>
            )}

            {/* Upcoming Chores */}
            {upcomingChores.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>UPCOMING CHORES</Text>
                <View style={styles.choreList}>
                  {upcomingChores.map(renderChoreCard)}
                </View>
              </View>
            )}
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
