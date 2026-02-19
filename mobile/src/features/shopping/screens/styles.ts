import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listSelectionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  listTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.surface,
    marginEnd: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  listTabActive: {
    backgroundColor: colors.iconBg.teal,
    borderColor: colors.primary,
  },
  listTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listTabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  leftColumn: {
    flex: 2,
    paddingEnd: 12,
  },
  rightColumn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitleIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  // Quick Add Modal Styles
  quickAddListSwitcher: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  quickAddListSwitcherContent: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickAddListBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    marginEnd: spacing.sm,
  },
  quickAddListBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Phone-specific styles
  mainGridPhone: {
    flexDirection: 'column',
    gap: 24,
  },
  rightColumnPhone: {
    flex: undefined,
    width: '100%',
  },
});
