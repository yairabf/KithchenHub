import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.recipes,
    borderColor: colors.recipes,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120, // Space for bottom pill nav
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});
