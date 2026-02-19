import { StyleSheet } from 'react-native';
import { colors } from '../../../../theme';

export const styles = StyleSheet.create({
  createListInputSection: {
    marginBottom: 24,
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
  createListInputRtl: {
    textAlign: 'right',
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
  pickerContentRtl: {
    direction: 'rtl',
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
});
