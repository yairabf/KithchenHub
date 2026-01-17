import { StyleSheet } from 'react-native';
import { colors, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  categoriesSection: {
    flex: 1,
    paddingVertical: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 13,
    color: colors.textMuted,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.md,
  },
  categoryBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryBgImage: {
    borderRadius: 16,
  },
  categoryOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    borderRadius: 16,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
