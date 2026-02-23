import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

export const styles = StyleSheet.create({


  // Content row layout
  contentRow: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainContentRow: {
    direction: 'ltr',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contentRowRtl: {
    direction: 'rtl',
    flexDirection: 'row',
  },

  // Item image
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.quantityBg,
  },

  // Custom icon container (for items without images)
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Item details (title and subtitle)
  itemDetails: {
    flex: 1,
    minWidth: 80,
  },
  itemDetailsRtl: {
    alignItems: 'flex-end',
  },

  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemNameRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },

  itemSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemSubtitleRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  subtitleNodeRtl: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },

  // Right element container
  rightElement: {
    flexShrink: 0,
  },

  // Ingredient info (recipe context)
  ingredientInfo: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.recipes,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Quantity controls (shopping context)
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityBtnDisabled: {
    opacity: 0.4,
  },

  quantityBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
});
