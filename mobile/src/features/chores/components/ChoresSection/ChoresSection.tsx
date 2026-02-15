import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import type { ChoresSectionProps } from './types';

/**
 * Chores Section Component
 * 
 * Reusable section with colored indicator, title, and chore list.
 * Used for "Today's Chores" and "Upcoming Chores".
 * 
 * @param props - Component props
 * @param props.title - Section title to display
 * @param props.chores - Array of chores to render
 * @param props.indicatorColor - Color of the vertical indicator bar ('primary' or 'secondary')
 * @param props.renderChoreCard - Function to render each chore card
 * @param props.testID - Optional test identifier
 * @param props.onLayout - Optional layout event handler
 * 
 * @example
 * ```tsx
 * <ChoresSection
 *   title="Today's Chores"
 *   chores={todayChores}
 *   indicatorColor="primary"
 *   renderChoreCard={(chore) => <ChoreCard chore={chore} />}
 * />
 * ```
 */
export function ChoresSection({
  title,
  chores,
  indicatorColor = 'primary',
  renderChoreCard,
  testID,
  onLayout,
}: ChoresSectionProps) {
  const indicatorStyle =
    indicatorColor === 'secondary'
      ? [styles.sectionIndicator, styles.sectionIndicatorAlt]
      : styles.sectionIndicator;

  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.sectionHeader} onLayout={onLayout}>
        <View style={indicatorStyle} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {chores.length > 0 ? (
        <View style={styles.choreList}>{chores.map(renderChoreCard)}</View>
      ) : null}
    </View>
  );
}
