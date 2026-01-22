import { StyleSheet } from 'react-native';
import { colors, withOpacity } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/spacing';
import { shadows } from '../../../../theme/shadows';

export const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  titlePlaceholder: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  descriptionPlaceholder: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryBadge: {
    backgroundColor: withOpacity(colors.recipes, 0.1),
  },
  popularBadge: {
    backgroundColor: '#FEF3C7', // yellow-100
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  categoryBadgeText: {
    color: colors.recipes,
  },
  popularBadgeText: {
    color: '#B45309', // yellow-700
  },
  textOverlay: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    color: colors.textLight,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textLight,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md + spacing.xs,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xxs,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
