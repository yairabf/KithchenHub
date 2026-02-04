import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../../../theme';

// Search bar dimension constants for consistent styling
const SEARCH_BAR_INPUT_HEIGHT = 40;
const SEARCH_BAR_TOTAL_HEIGHT = 56;
const SEARCH_BAR_VERTICAL_PADDING = (SEARCH_BAR_TOTAL_HEIGHT - SEARCH_BAR_INPUT_HEIGHT) / 2;

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  backdrop: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? '100vw' : '100%',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    zIndex: 998,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: SEARCH_BAR_VERTICAL_PADDING,
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
    height: SEARCH_BAR_INPUT_HEIGHT,
    paddingVertical: 0,
  },
  searchDropdown: {
    position: 'absolute',
    top: SEARCH_BAR_TOTAL_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    overflow: 'hidden',
    ...shadows.xl,
    pointerEvents: 'auto',
    zIndex: 1000,
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
  } as const,
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
  customItemRow: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.shopping,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  customItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.shopping + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
