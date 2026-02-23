import React from 'react';
import { View, Text, TouchableOpacity, GestureResponderEvent, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  isRtl,
  onToggle,
  onEdit,
  onDelete,
}: ChoreCardProps) {
  const { t, i18n } = useTranslation('chores');
  const isRtlAppLanguage = isRtl ?? (i18n.dir() === 'rtl' || I18nManager.isRTL);
  const assigneeLabel = chore.assignee ?? t('modal.assigneeUnassigned');
  const recurrenceLabel = chore.recurrencePattern
    ? t(`modal.recurrence.${chore.recurrencePattern}`)
    : chore.isRecurring
      ? t('modal.recurrence.daily')
      : t('card.oneTime');

  const handleEditPress = (e: GestureResponderEvent) => {
    e?.stopPropagation?.();
    onEdit(chore);
  };

  return (
    <SwipeableWrapper
      key={chore.id}
      onSwipeDelete={() => onDelete(chore.id)}
      borderRadius={borderRadius.xxl}
    >
      <ListItemCardWrapper
        backgroundColor={colors.surface}
        onPress={() => onToggle(chore.id)}
        style={styles.cardContainer}
        testID={`chore-card-${chore.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${chore.title}, ${chore.isCompleted ? t('status.done') : t('status.pending')}, ${assigneeLabel}`}
        accessibilityHint={chore.isCompleted ? t('card.toggleDoneHint') : t('card.togglePendingHint')}
      >
        <View style={styles.choreCard}>
          <View style={styles.choreCardLeft}>
            <View style={styles.choreCardIcon}>
              <Text style={styles.choreCardIconText}>{chore.icon ?? '📋'}</Text>
            </View>
            <View style={styles.choreCardContent}>
              <View style={isRtlAppLanguage ? styles.choreCardNameRowRtl : styles.choreCardNameRowLtr}>
                <Text
                  style={[
                    styles.choreCardName,
                    isRtlAppLanguage ? styles.choreCardNameRtl : styles.choreCardNameLtr,
                    chore.isCompleted && styles.choreCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {chore.title}
                </Text>
              </View>
              <View style={styles.choreCardMeta}>
                <View style={[styles.choreTag, styles.choreTagPrimary]}>
                  <Text style={styles.choreTagText} numberOfLines={1}>
                    {recurrenceLabel}
                  </Text>
                </View>
                <View style={[styles.choreTag, styles.choreTagSecondary]}>
                  <Text style={styles.choreTagText} numberOfLines={1}>
                    {assigneeLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.choreCardRight}>
            <Text style={styles.choreCardTime} numberOfLines={1}>
              {t('card.dueBy')} {formatChoreDueDateTime(chore.dueDate, chore.dueTime)}
            </Text>
            <TouchableOpacity
              style={styles.choreCardEditButton}
              onPress={handleEditPress}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t('card.editLabel', { title: chore.title })}
              accessibilityHint={t('card.editHint')}
            >
              <Ionicons name="create-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>

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
        </View>
      </ListItemCardWrapper>
    </SwipeableWrapper>
  );
});
