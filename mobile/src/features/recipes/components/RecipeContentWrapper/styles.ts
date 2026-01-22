import { StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/spacing';
import { shadows } from '../../../../theme/shadows';

export const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  stickyHeaderContainer: {
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  tabletHeader: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    width: '100%',
  },
  tabletHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  tabletTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tabletTitleLeft: {
    flex: 35,
  },
  tabletTitleRight: {
    flex: 65,
    paddingLeft: spacing.xl,
  },
  tabletContent: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  ingredientsColumn: {
    flex: 35,
    flexShrink: 0,
  },
  stepsColumn: {
    flex: 65,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ingredientsScroll: {
    flex: 1,
  },
  ingredientsScrollContent: {
    paddingBottom: spacing.xl,
  },
  stepsScroll: {
    flex: 1,
  },
  stepsScrollContent: {
    paddingBottom: spacing.xl,
  },
  mobileContent: {
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.recipes,
    fontWeight: '700',
  },
  tabContent: {
    width: '100%',
  },
});
