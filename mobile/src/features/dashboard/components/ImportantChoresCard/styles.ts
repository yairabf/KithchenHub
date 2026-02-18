import { StyleSheet } from "react-native";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../../../../theme";

export const styles = StyleSheet.create({
  rightColumn: {
    flex: 5,
  },
  fullWidthColumn: {
    flex: undefined,
    width: "100%",
  },
  choresCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  choresSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  choresTitleBlock: {
    flex: 1,
  },
  choresTitleBlockRtl: {
    alignItems: "stretch",
    width: "100%",
  },
  choresSectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  choresSectionTitleIosRtl: {
    writingDirection: "rtl",
  },
  choresSectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  choresSectionSubtitleIosRtl: {
    writingDirection: "rtl",
  },
  viewAllLink: {
    ...typography.labelBold,
    color: colors.primary,
  },
  viewAllLinkRtl: {
    textAlign: "left",
    writingDirection: "rtl",
  },
  choreList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  choreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    gap: spacing.md,
  },
  choreRowDone: {
    opacity: 0.7,
  },
  choreLeftSection: {
    flex: 1,
    flexDirection: "column",
    gap: spacing.sm,
    minWidth: 0,
  },
  choreTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  choreAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    backgroundColor: colors.avatarBackground,
    borderWidth: 2,
    borderColor: colors.surface,
    flexShrink: 0,
  },
  choreAvatar: {
    width: "100%",
    height: "100%",
  },
  choreContent: {
    flex: 1,
    minWidth: 0,
  },
  choreTitle: {
    ...typography.body,
    fontWeight: "700",
  },
  choreTitleDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  choreMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  choreMetaText: {
    ...typography.tiny,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  choreMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    flexShrink: 0,
  },
  addHouseholdTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.borderDashed,
    borderRadius: borderRadius.xl,
  },
  addHouseholdTaskText: {
    ...typography.labelBold,
    color: colors.textMuted,
  },
});
