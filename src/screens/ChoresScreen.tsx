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
import { colors, spacing, borderRadius, typography } from '../theme';
import { ProgressRing, SwipeableChoreCard } from '../components/chores';
import { ChoreDetailsModal } from '../components/modals/ChoreDetailsModal';

interface Chore {
  id: string;
  name: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  reminder?: string;
  isRecurring?: boolean;
  completed: boolean;
  section: 'today' | 'thisWeek' | 'recurring';
  icon?: string;
}

const mockChores: Chore[] = [
  { id: '1', name: 'Wash dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', reminder: '1h', completed: false, section: 'today', icon: '🍽️' },
  { id: '2', name: 'Fold Mitadm', assignee: 'Dad', dueDate: 'Today', dueTime: '3:00 PM', reminder: '30m', completed: true, section: 'today', icon: '👕' },
  { id: '3', name: 'Wash Dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', completed: false, section: 'today', icon: '🍽️' },
  { id: '4', name: 'Fold bltroom', assignee: 'Kids', dueDate: 'Today', dueTime: '1:00 PM', completed: false, section: 'today', icon: '🧹' },
  { id: '5', name: 'Vacuum Living Room', assignee: 'Kids', dueDate: 'Tomorrow', dueTime: '10:00 AM', completed: false, section: 'thisWeek', icon: '🧹' },
  { id: '6', name: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '10:00 AM', completed: false, section: 'thisWeek', icon: '👕' },
  { id: '7', name: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '9:00 AM', completed: false, section: 'thisWeek', icon: '👕' },
  { id: '8', name: 'Mop Kitchen Floor', assignee: 'Dad', dueDate: 'Wednesday', dueTime: '9:00 AM', completed: false, section: 'thisWeek', icon: '🧽' },
];

// Pastel color palette inspired by reference
const choreColors = [
  '#B8E6E1', // Cyan/turquoise
  '#C5E8B7', // Light green
  '#FFD4A3', // Peach/orange
  '#FFB5A7', // Coral/salmon
  '#D4C5F9', // Lavender
  '#FFE5B4', // Light yellow
];

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
    const bgColor = choreColors[index % choreColors.length];
    
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

      {/* Add New Chore Pill Button */}
      <TouchableOpacity 
        style={styles.addChorePill}
        onPress={onOpenChoresModal}
        activeOpacity={0.8}
      >
        <View style={styles.addChoreIconContainer}>
          <Ionicons name="add" size={24} color={colors.warning} />
        </View>
        <Text style={styles.addChoreText}>Add New Chore</Text>
      </TouchableOpacity>

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
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  choreCardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  choreCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  choreCardTime: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  choreCardCheck: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Checkmarks
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  uncheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  choreCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  choreCardAssignee: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    marginRight: spacing.sm,
    maxWidth: 80,
  },
  choreCardAssigneeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  
  // Add New Chore Pill
  addChorePill: {
    position: 'absolute',
    bottom: 100, // Above bottom pill nav
    left: '50%',
    transform: [{ translateX: -100 }], // Center the 200px wide button
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: spacing.sm,
  },
  addChoreIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.addButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addChoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
