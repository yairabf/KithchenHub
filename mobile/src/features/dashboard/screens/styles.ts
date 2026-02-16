import { StyleSheet } from "react-native";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  componentSize,
  zIndex,
} from "../../../theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dateTimeContainer: {
    alignItems: "flex-end",
    marginRight: spacing.sm,
  },
  timeText: {
    ...typography.h4,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 24,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    padding: spacing.sm,
    position: "relative",
  },
  profileSectionSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 10,
    height: 10,
    backgroundColor: colors.error,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: "flex-end",
  },
  profileRole: {
    ...typography.tiny,
    marginBottom: spacing.xxs,
    color: colors.textMuted,
  },
  profileName: {
    ...typography.labelBold,
  },
  avatarContainer: {
    width: componentSize.avatar.md,
    height: componentSize.avatar.md,
    borderRadius: componentSize.avatar.md / 2,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: "hidden",
    backgroundColor: colors.avatarBackground,
    ...shadows.md,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  // Two-column layout
  mainGrid: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  leftColumn: {
    flex: 7,
  },
  rightColumn: {
    flex: 5,
  },
  mainGridPhone: {
    flexDirection: "column",
    gap: spacing.xl,
  },
  fullWidthColumn: {
    flex: undefined,
    width: "100%",
  },
  leftColumnContent: {
    gap: spacing.lg,
  },
  // Shopping widget card
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
  shoppingCardTitleBlock: {
    flex: 1,
  },
  shoppingCardTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  shoppingCardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.quantityBg,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
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
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  micButton: {
    padding: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  suggestedLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
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
  // Quick stats row
  quickStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  quickStatCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  quickStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quickStatIconShopping: {
    backgroundColor: colors.pastel.green,
  },
  quickStatIconRecipes: {
    backgroundColor: colors.pastel.peach,
  },
  quickStatLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  quickStatValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickStatValue: {
    ...typography.h4,
    fontWeight: "800",
  },
  // Chores section (right column)
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
  choresSectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  choresSectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  viewAllLink: {
    ...typography.labelBold,
    color: colors.primary,
  },
  choreList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  choreRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    gap: spacing.md,
  },
  choreRowDone: {
    opacity: 0.7,
  },
  choreAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    backgroundColor: colors.avatarBackground,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  choreAvatar: {
    width: "100%",
    height: "100%",
  },
  choreContent: {
    flex: 1,
    minWidth: 0,
  },
  choreTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  choreTitle: {
    ...typography.body,
    fontWeight: "700",
    flex: 1,
  },
  choreTitleDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  choreStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    ...typography.tiny,
    textTransform: "uppercase",
    overflow: "hidden",
  },
  choreStatusPending: {
    backgroundColor: colors.quantityBg,
  },
  choreStatusDone: {
    backgroundColor: colors.success,
  },
  choreStatusBadgeText: {
    ...typography.tiny,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  choreStatusBadgeTextDone: {
    color: colors.textLight,
  },
  choreMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  choreMetaText: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  choreMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
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
