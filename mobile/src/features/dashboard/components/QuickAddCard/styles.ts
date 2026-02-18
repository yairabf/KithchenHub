import { StyleSheet } from "react-native";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  zIndex,
} from "../../../../theme";

export const styles = StyleSheet.create({
  shoppingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  shoppingCardMobile: {
    maxHeight: 360,
  },
  shoppingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  // Note: shoppingCardHeaderRtl (row-reverse) is intentionally not used.
  // iOS behaves incorrectly with row-reverse in RTL context (doubles the reversal).
  // Instead, we conditionally render children in different order.
  // See TextBlock component for the workaround.
  shoppingCardTitleBlock: {
    flex: 1,
  },
  shoppingCardTitleBlockRtl: {
    alignItems: "stretch",
    width: "100%",
  },
  shoppingCardTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  /** 
   * iOS-specific RTL workaround for title text.
   * Only writingDirection is needed when text is wrapped in rtlTextRow.
   * The row's flexbox handles positioning.
   */
  shoppingCardTitleIosRtl: {
    writingDirection: "rtl",
  },
  shoppingCardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  /** 
   * iOS-specific RTL workaround for subtitle text.
   * Only writingDirection is needed when text is wrapped in rtlTextRow.
   * The row's flexbox handles positioning.
   */
  shoppingCardSubtitleIosRtl: {
    writingDirection: "rtl",
  },
  mainListBadge: {
    backgroundColor: colors.pastel.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  mainListBadgeText: {
    ...typography.tiny,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainListBadgeTextRtl: {
    textTransform: "none",
    letterSpacing: 0,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputRowWithDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
    zIndex: zIndex.dropdown + 1,
  },
  grocerySearchBarWrapper: {
    flex: 1,
    minWidth: 0,
  },
  micButton: {
    padding: spacing.sm,
  },
  suggestedSection: {
    zIndex: 0,
  },
  suggestedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  suggestedToggleText: {
    ...typography.labelBold,
    color: colors.primary,
  },
  suggestedLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  suggestedLabelRtl: {
    textTransform: "none",
    letterSpacing: 0,
    textAlign: "right",
    writingDirection: "rtl",
  },
  suggestionScrollArea: {
    maxHeight: 120,
  },
  suggestionChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  suggestionChipText: {
    ...typography.labelBold,
    color: colors.textSecondary,
  },
});
