import { StyleSheet } from "react-native";
import {
  colors,
  spacing,
  typography,
  shadows,
  componentSize,
} from "../../../theme";

export const styles = StyleSheet.create({
  rtlAlign: {
    textAlign: 'right',
  },
  rtlNativeText: {
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
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
    marginEnd: spacing.sm,
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
    marginStart: spacing.sm,
    marginEnd: spacing.sm,
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
});
