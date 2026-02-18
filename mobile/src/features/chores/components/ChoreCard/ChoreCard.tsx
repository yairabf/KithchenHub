import React from 'react';
import { View, Text, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { SwipeableWrapper } from '../../../../common/components/SwipeableWrapper';
import { ListItemCardWrapper } from '../../../../common/components/ListItemCardWrapper';
import { borderRadius } from '../../../../theme';
import { formatChoreDueDateTime } from '../../../../common/utils/choreDisplayUtils';
import { styles } from './styles';
import type { ChoreCardProps } from './types';

/**
 * Chore Card Component
 * 
 * Renders a single chore item with swipe-to-delete and edit functionality.
 * The card displays the chore icon, title, due date/time, optional assignee,
 * and completion status. Users can toggle completion, edit details, or delete
 * via swipe gesture.
 * 
 * @param props - Component props
 * @param props.chore - The chore object to display
 * @param props.bgColor - Background color for the card
 * @param props.onToggle - Called when user taps card to toggle completion
 * @param props.onEdit - Called when user taps edit button
 * @param props.onDelete - Called when user swipes to delete
 * 
 * @example
 * ```tsx
 * <ChoreCard
 *   chore={myChore}
 *   bgColor={colors.surface}
 *   onToggle={(id) => toggleChore(id)}
 *   onEdit={(chore) => openEditModal(chore)}
 *   onDelete={(id) => deleteChore(id)}
 * />
 * ```
 */
export const ChoreCard = React.memo(function ChoreCard({
  chore,
  bgColor,
  isWebRtl = false,
  onToggle,
  onEdit,
  onDelete,
}: ChoreCardProps) {
  const handleEditPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onEdit(chore);
  };

  return (
    <SwipeableWrapper
      key={chore.id}
      onSwipeDelete={() => onDelete(chore.id)}
      borderRadius={borderRadius.xxl}
    >
      <ListItemCardWrapper
        backgroundColor={bgColor}
        onPress={() => onToggle(chore.id)}
        testID={`chore-card-${chore.id}`}
      >
        <View style={styles.choreCard}>
          {/* Left side: Icon and content */}
          <View style={styles.choreCardLeft}>
            <View style={styles.choreCardIconRow}>
              <View style={styles.choreCardIcon}>
                <Text style={styles.choreCardIconText}>{chore.icon ?? '📋'}</Text>
              </View>
              <TouchableOpacity
                style={styles.choreCardEditButton}
                onPress={handleEditPress}
                activeOpacity={0.6}
              >
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.choreCardContent}>
              <Text
                style={[styles.choreCardName, isWebRtl && styles.choreCardTextRtl, chore.isCompleted && styles.choreCompleted]}
                numberOfLines={1}
              >
                {chore.title}
              </Text>
              <View style={styles.choreCardMeta}>
                {chore.assignee ? (
                  <View style={styles.choreCardAssignee}>
                    <Text style={[styles.choreCardAssigneeText, isWebRtl && styles.choreCardTextRtl]} numberOfLines={1}>
                      {chore.assignee}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.choreCardTime, isWebRtl && styles.choreCardTextRtl]} numberOfLines={1}>
                  {formatChoreDueDateTime(chore.dueDate, chore.dueTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Right side: Checkbox */}
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
