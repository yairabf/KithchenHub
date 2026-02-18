import { StyleSheet } from "react-native";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../../../../theme";

export const styles = StyleSheet.create({
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
  quickStatCardRtl: {
    direction: "rtl",
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
  quickStatLabelRtl: {
    writingDirection: "rtl",
    textTransform: "none",
  },
  quickStatValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  quickStatValueRowRtl: {
    direction: "rtl",
  },
  quickStatValue: {
    ...typography.h4,
    fontWeight: "800",
  },
  quickStatValueRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlTextRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    width: "100%",
  },
});
