import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDirectionalIcon } from "../../../../common/utils/rtlIcons";
import { colors } from "../../../../theme";
import { styles } from "./styles";
import type { QuickStatCardProps } from "./types";

export function QuickStatCard({ stat, isRtl, onPress }: QuickStatCardProps) {
  const TextWrapper = isRtl
    ? ({ children }: { children: React.ReactNode }) => (
        <View style={styles.rtlTextRow}>{children}</View>
      )
    : React.Fragment;

  return (
    <TouchableOpacity
      style={[styles.quickStatCard, isRtl && styles.quickStatCardRtl]}
      onPress={() => onPress(stat.route)}
      activeOpacity={0.7}
      accessibilityLabel={`${stat.label}: ${stat.value}`}
      accessibilityRole="button"
      accessibilityHint={`Navigate to ${stat.label}`}
    >
      <View
        style={[
          styles.quickStatIconContainer,
          stat.iconBgStyle === "shopping" && styles.quickStatIconShopping,
          stat.iconBgStyle === "recipes" && styles.quickStatIconRecipes,
        ]}
      >
        <Ionicons
          name={stat.icon}
          size={20}
          color={
            stat.iconBgStyle === "shopping" ? colors.primary : colors.secondary
          }
        />
      </View>
      <TextWrapper>
        <Text style={[styles.quickStatLabel, isRtl && styles.quickStatLabelRtl]}>
          {stat.label}
        </Text>
      </TextWrapper>
      <View style={[styles.quickStatValueRow, isRtl && styles.quickStatValueRowRtl]}>
        <Text style={[styles.quickStatValue, isRtl && styles.quickStatValueRtl]}>
          {stat.value}
        </Text>
        <Ionicons
          name={getDirectionalIcon("chevron-forward")}
          size={16}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}
