import { StyleSheet } from 'react-native';
import { colors, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  leftColumn: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listsDrawer: {
    marginBottom: 16,
  },
  listsDrawerContent: {
    gap: 12,
    paddingVertical: 4,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    minWidth: 180,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.lg,
  },
  listCardActive: {
    borderColor: colors.chores,
    backgroundColor: '#FAFAFA',
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCardContent: {
    flex: 1,
  },
  listCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listCardNameActive: {
    color: colors.chores,
  },
  listCardCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  listCardIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    position: 'absolute',
    right: 0,
  },
  addListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    minWidth: 140,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addListText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  itemsList: {
    gap: 8,
  },
});
