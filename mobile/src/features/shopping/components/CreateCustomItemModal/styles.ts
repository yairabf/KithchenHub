import { StyleSheet } from 'react-native';
import { colors } from '../../../../theme';

export const styles = StyleSheet.create({
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
  modalItemNameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
    width: '100%',
  },
  modalItemNameInputRtl: {
    textAlign: 'right',
  },
  modalItemCategory: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalCategorySection: {
    marginBottom: 24,
  },
  modalQuantitySection: {
    marginBottom: 0,
  },

  modalItemDisplayRtl: {
    flexDirection: 'row-reverse',
  },
  modalItemInfoRtl: {
    alignItems: 'flex-end',
  },
  modalSectionRtl: {
    direction: 'rtl',
    alignSelf: 'stretch',
  },
  rtlTextRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    width: '100%',
  },
  modalTextRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
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
  modalQuantityControlsRtl: {
    direction: 'rtl',
    justifyContent: 'center',
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
  modalQuantityInputRtl: {
    writingDirection: 'rtl',
  },
});
