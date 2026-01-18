import { StyleSheet } from 'react-native';
import { colors, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTile: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  itemImageContainer: {
    width: '100%',
    height: '70%',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemNameContainer: {
    height: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  itemName: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
