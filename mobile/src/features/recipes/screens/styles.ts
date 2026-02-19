import { StyleSheet } from 'react-native';
import { colors, spacing, shadows } from '../../../theme';

const FILTER_BOTTOM_MARGIN = spacing.xs;
const FILTER_CHIPS_MIN_HEIGHT = 96;

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
    marginBottom: spacing.xs,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
    ...shadows.md,
  },
  searchInput: {
    flex: 1,
    marginStart: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterRow: {
    minHeight: FILTER_CHIPS_MIN_HEIGHT,
    marginBottom: FILTER_BOTTOM_MARGIN,
  },
  filterSection: {
    marginTop: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 2,
  },
  filterContainer: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: spacing.xs,
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
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
