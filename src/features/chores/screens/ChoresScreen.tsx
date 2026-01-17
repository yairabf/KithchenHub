import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows, pastelColors, componentSize } from '../../../theme';
import { ProgressRing } from '../components/ProgressRing';
import { SwipeableChoreCard } from '../components/SwipeableChoreCard';
import { ChoreDetailsModal } from '../components/ChoreDetailsModal';
import { FloatingActionButton } from '../../../common/components/FloatingActionButton';
import { mockChores, type Chore } from '../../../mocks/chores';


interface ChoresScreenProps {
  onOpenChoresModal?: () => void;
  onRegisterAddChoreHandler?: (handler: (newChore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => void) => void;
}

export function ChoresScreen({ onOpenChoresModal, onRegisterAddChoreHandler }: ChoresScreenProps) {
  const [chores, setChores] = useState(mockChores);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { width } = useWindowDimensions();
  
  // Responsive breakpoint: tablet/landscape at 768px+
  const isWideScreen = width >= 768;

  const toggleChore = (id: string) => {
    setChores(chores.map(chore =>
      chore.id === id ? { ...chore, completed: !chore.completed } : chore
    ));
  };

  const handleChorePress = (chore: Chore) => {
    setSelectedChore(chore);
    setShowDetailsModal(true);
  };

  const handleUpdateAssignee = (choreId: string, assignee: string | undefined) => {
    setChores(chores.map(chore =>
      chore.id === choreId ? { ...chore, assignee } : chore
    ));
  };

  const handleUpdateChore = (choreId: string, updates: Partial<Chore>) => {
    setChores(chores.map(chore =>
      chore.id === choreId ? { ...chore, ...updates } : chore
    ));
  };

  const handleDeleteChore = (choreId: string) => {
    setChores(chores.filter(chore => chore.id !== choreId));
  };

  const handleAddChore = (newChore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => {
    const chore: Chore = {
      id: Date.now().toString(),
      name: newChore.name,
      assignee: newChore.assignee,
      dueDate: newChore.dueDate,
      dueTime: newChore.dueTime,
      completed: false,
      section: newChore.section,
      icon: newChore.icon,
    };
    setChores([...chores, chore]);
  };

  // Register the handler with parent on mount
  useEffect(() => {
    if (onRegisterAddChoreHandler) {
      onRegisterAddChoreHandler(handleAddChore);
    }
  }, [onRegisterAddChoreHandler]);

  const todayChores = chores.filter(c => c.section === 'today');
  const upcomingChores = chores.filter(c => c.section === 'thisWeek' || c.section === 'recurring');

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
      <SwipeableChoreCard
        key={chore.id}
        onDelete={() => handleDeleteChore(chore.id)}
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
      </SwipeableChoreCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.homeButton}>
            <Ionicons name="home-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HOME CHORES</Text>
        </View>
      </View>

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

      {/* Add New Chore Button */}
      <FloatingActionButton 
        label="Add New Chore"
        onPress={onOpenChoresModal}
      />

      {/* Chore Details Modal */}
      <ChoreDetailsModal
        visible={showDetailsModal}
        chore={selectedChore}
        onClose={() => setShowDetailsModal(false)}
        onUpdateAssignee={handleUpdateAssignee}
        onUpdateChore={handleUpdateChore}
      />
    </SafeAreaView>
  );
}

// Export the handleAddChore type for use in parent components
export type AddChoreHandler = (newChore: {
  name: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  section: 'today' | 'thisWeek';
}) => void;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  homeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140, // Space for add button + bottom nav
  },
  
  // Layout containers
  wideLayout: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  narrowLayout: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  
  // Progress Card
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  
  // Unified Chore Cards
  choreList: {
    gap: spacing.sm,
  },
  choreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  choreCardIcon: {
    marginRight: spacing.sm,
  },
  choreCardIconText: {
    fontSize: 26,
  },
  choreCardEditButton: {
    width: componentSize.button.sm,
    height: componentSize.button.sm,
    borderRadius: componentSize.button.sm / 2,
    backgroundColor: colors.transparent.white70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  choreCardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  choreCardName: {
    ...typography.labelBold,
    marginBottom: spacing.xxs,
  },
  choreCardTime: {
    ...typography.tinyMuted,
  },
  choreCardCheck: {
    width: componentSize.checkbox + spacing.xxs,
    height: componentSize.checkbox + spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Checkmarks
  checkmark: {
    width: componentSize.checkbox,
    height: componentSize.checkbox,
    borderRadius: componentSize.checkbox / 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  uncheckmark: {
    width: componentSize.checkbox,
    height: componentSize.checkbox,
    borderRadius: componentSize.checkbox / 2,
    backgroundColor: colors.transparent.white50,
    borderWidth: 2,
    borderColor: colors.transparent.white80,
  },
  choreCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  choreCardAssignee: {
    backgroundColor: colors.transparent.white60,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    maxWidth: 80,
  },
  choreCardAssigneeText: {
    ...typography.tiny,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
