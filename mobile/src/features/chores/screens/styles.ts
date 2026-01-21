import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, componentSize } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
