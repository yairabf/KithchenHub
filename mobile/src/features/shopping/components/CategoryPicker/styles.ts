import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../../../theme';

const TRIGGER_HEIGHT = 48;

/** Show 5 categories in view; item height = padding*2 + icon = 40px */
export const DROPDOWN_VISIBLE_ITEMS = 5;
export const DROPDOWN_ITEM_HEIGHT = 40;
export const DROPDOWN_MAX_HEIGHT = DROPDOWN_VISIBLE_ITEMS * DROPDOWN_ITEM_HEIGHT;

/** Gap between trigger and dropdown in pixels */
export const DROPDOWN_SPACING = 4;

/** Default width for dropdown in test/fallback scenarios */
export const DROPDOWN_FALLBACK_WIDTH = 300;

/** High z-index so dropdown appears above modal content, actions, and other overlays */
const PICKER_Z_INDEX = 9999;

export const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    position: 'relative',
    zIndex: PICKER_Z_INDEX,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: TRIGGER_HEIGHT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerRtl: {
    direction: 'rtl',
  },
  triggerOpen: {
    borderColor: colors.shopping,
    borderWidth: 2,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },

  triggerContentRtl: {
    flexDirection: 'row-reverse',
  },
  triggerIcon: {
    width: 28,
    height: 28,
  },
  triggerIconPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  triggerChevron: {
    color: colors.textSecondary,
    marginStart: spacing.xs,
  },
  triggerChevronRtl: {
    marginStart: 0,
    marginEnd: spacing.xs,
  },
  dropdown: {
    position: 'absolute',
    top: TRIGGER_HEIGHT + DROPDOWN_SPACING,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.lg,
    zIndex: PICKER_Z_INDEX + 1,
  },
  dropdownRtl: {
    direction: 'rtl',
  },
  dropdownWrapper: {
    position: 'absolute',
    top: TRIGGER_HEIGHT + DROPDOWN_SPACING,
    left: 0,
    right: 0,
    height: DROPDOWN_MAX_HEIGHT,
  },
  dropdownWrapperHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  /** When dropdown is inside the in-place wrapper, position relative to wrapper (wrapper already has top) */
  dropdownInPlace: {
    top: 0,
  },
  /** When dropdown is rendered in a portal (web), wrapper has fixed position so we only need width */
  dropdownPortal: {
    position: 'relative',
    top: 0,
    left: 0,
    right: undefined,
  },
  dropdownScroll: {
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownItemRtl: {
    flexDirection: 'row-reverse',
  },
  dropdownItemSelected: {
    backgroundColor: colors.shopping + '15',
  },
  dropdownItemIcon: {
    width: 24,
    height: 24,
  },
  dropdownItemIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.shopping,
    fontWeight: '600',
  },
  textRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
