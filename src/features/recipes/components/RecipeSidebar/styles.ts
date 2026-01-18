import { StyleSheet } from 'react-native';
import { colors, withOpacity } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/spacing';
import { shadows } from '../../../../theme/shadows';

export const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
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
  title: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  createdBy: {
    fontWeight: '700',
    color: colors.textPrimary,
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
  // Ingredients section
  ingredientsSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  ingredientsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  ingredientsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  ingredientsList: {
    gap: spacing.md,
  },
  ingredientCardWrapper: {
    width: '100%',
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: withOpacity(colors.recipes, 0.1),
    borderRadius: borderRadius.full,
  },
  addAllButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.recipes,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
