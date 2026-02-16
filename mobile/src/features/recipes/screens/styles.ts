import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../../theme';

/**
 * Spacing constants for recipe screen layout.
 * These values optimize the vertical rhythm and ensure proper visual hierarchy.
 */
const FILTER_MAX_HEIGHT = 110;       // Increased from 90 to accommodate filter chips + extra padding (prevents iOS clipping)
const FILTER_VERTICAL_PADDING = 20;  // Increased from 15 to create more breathing room and prevent top clipping on iOS
const SEARCH_BOTTOM_MARGIN = 5;     // Reduced from 24px to tighten layout and reduce scrolling
const FILTER_BOTTOM_MARGIN = 5;     // Minimal space before recipe grid starts

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    // marginBottom: SEARCH_BOTTOM_MARGIN,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
    ...shadows.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxHeight: FILTER_MAX_HEIGHT,
    marginBottom: FILTER_BOTTOM_MARGIN,
  },
  filterContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? FILTER_VERTICAL_PADDING + 5 : FILTER_VERTICAL_PADDING,  // Extra padding on iOS
    overflow: 'visible',  // Prevent clipping on iOS
  },
  filterContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    // paddingTop: Platform.OS === 'ios' ? 20 : 12,  // Extra padding on iOS to prevent negative y position clipping
    alignItems: 'flex-start',  // Changed from 'center' to prevent negative y positioning that clips content
    gap: 20,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'flex-start',  // Changed from 'center' to prevent negative y positioning
    gap: 8,
  },
  filterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  filterCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.iconBg.teal,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  filterChipTextActive: {
    color: colors.textPrimary,
  },
  filterHideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
  },
  filterHideButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: FILTER_BOTTOM_MARGIN,
    marginHorizontal: 24,
  },
  filterShowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
