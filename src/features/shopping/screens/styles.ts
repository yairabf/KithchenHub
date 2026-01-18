import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  rightColumn: {
    flex: 1,
  },
  // Modal Styles
  modalItemDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalItemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.quantityBg,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalItemCategory: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalQuantitySection: {
    marginBottom: 0,
  },
  modalQuantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  modalQuantityBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalQuantityInput: {
    width: 80,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  createListInputSection: {
    marginBottom: 24,
  },
  createListLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  createListInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  createListIconSection: {
    marginBottom: 24,
  },
  iconPickerContent: {
    gap: 12,
    paddingVertical: 4,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionActive: {
    borderColor: colors.chores,
    backgroundColor: colors.chores + '10',
  },
  createListColorSection: {
    marginBottom: 24,
  },
  colorPickerContent: {
    gap: 12,
    paddingVertical: 4,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: colors.textPrimary,
  },
  // Quick Add Modal Styles
  quickAddListSwitcher: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  quickAddListSwitcherContent: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickAddListBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  quickAddListBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Phone-specific styles
  mainGridPhone: {
    flexDirection: 'column',
    gap: 24,
  },
  rightColumnPhone: {
    flex: undefined,
    width: '100%',
  },
});
