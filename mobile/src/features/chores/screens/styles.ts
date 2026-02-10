import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, componentSize } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  headerMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  headerPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 18,
    ...shadows.lg,
  },
  headerPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
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
    borderRadius: 40,
    padding: spacing.xl + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressRowPhone: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressRingWrap: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: 2,
  },
  progressDetails: {
    flex: 1,
  },
  progressDetailsPhone: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  progressBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  progressBodyPhone: {
    textAlign: 'center',
  },
  searchContainer: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionIndicatorAlt: {
    backgroundColor: colors.secondary,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionAction: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // Unified Chore Cards - same container look as ShoppingItemCard (GroceryCard)
  choreList: {
    gap: spacing.sm,
  },
  choreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // Styling handled by ListItemCardWrapper
  },
  choreCardIcon: {
    marginRight: spacing.sm,
    position: 'relative',
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    maxWidth: 80,
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  choreCardAssigneeText: {
    ...typography.tiny,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
