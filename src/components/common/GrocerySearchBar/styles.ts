import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    // 11px vertical padding (spacing.sm + 3) to achieve 52px total height with 30px input
    paddingVertical: spacing.sm + 3,
    gap: spacing.sm,
  },
  searchBarSurface: {
    backgroundColor: colors.surface,
  },
  searchBarBackground: {
    backgroundColor: colors.background,
  },
  searchBarShadow: {
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    height: 30,
  },
  searchDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    overflow: 'hidden',
    ...shadows.xl,
  },
  searchDropdownScroll: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  searchResultImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.quantityBg,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  searchResultCategory: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addIconButton: {
    padding: spacing.xs,
  },
});
