import React from 'react';
import { View, Text } from 'react-native';
import { ProgressRing } from '../ProgressRing';
import { styles } from './styles';
import type { ChoresProgressCardProps } from './types';

/**
 * Chores Progress Card Component
 * 
 * Displays daily chore progress with a progress ring, percentage, and motivational text.
 * Adapts layout for wide (tablet) vs narrow (phone) screens.
 * 
 * @param props - Component props
 * @param props.progress - Progress value from 0 to 100
 * @param props.completedCount - Number of completed chores
 * @param props.totalCount - Total number of chores
 * @param props.isWideScreen - Whether to use horizontal (tablet) or vertical (phone) layout
 * 
 * @example
 * ```tsx
 * <ChoresProgressCard
 *   progress={75}
 *   completedCount={3}
 *   totalCount={4}
 *   isWideScreen={width >= 768}
 * />
 * ```
 */
export function ChoresProgressCard({
  progress,
  completedCount,
  totalCount,
  isWideScreen,
}: ChoresProgressCardProps) {
  // Validate and normalize inputs to handle edge cases
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const safeCompleted = Math.max(0, completedCount ?? 0);
  const safeTotal = Math.max(0, totalCount ?? 0);

  const ringSize = isWideScreen ? 160 : 140;
  const bodyText = isWideScreen
    ? `You've completed ${safeCompleted} out of ${safeTotal} chores today. Keep it up to reach your weekly goals!`
    : `You've completed ${safeCompleted} out of ${safeTotal} chores today. Keep it up!`;

  return (
    <View style={styles.progressCard}>
      <View
        style={[
          styles.progressRow,
          !isWideScreen && styles.progressRowPhone,
        ]}
      >
        <View style={styles.progressRingWrap}>
          <ProgressRing
            progress={safeProgress}
            size={ringSize}
            showPercentage={false}
            showEmoji={false}
          />
          <View style={styles.progressRingText}>
            <Text style={styles.progressPercent}>{Math.round(safeProgress)}%</Text>
            <Text style={styles.progressLabel}>Today</Text>
          </View>
        </View>
        <View
          style={[
            styles.progressDetails,
            !isWideScreen && styles.progressDetailsPhone,
          ]}
        >
          <Text style={styles.progressTitle}>Daily Progress</Text>
          <Text
            style={[styles.progressBody, !isWideScreen && styles.progressBodyPhone]}
            numberOfLines={isWideScreen ? undefined : 3}
          >
            {bodyText}
          </Text>
        </View>
      </View>
    </View>
  );
}
