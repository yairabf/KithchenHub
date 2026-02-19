import React from "react";
import { View } from "react-native";
import { QuickStatCard } from "./QuickStatCard";
import { styles } from "./styles";
import type { QuickStatsRowProps } from "./types";

export function QuickStatsRow({ stats, isRtl, onPressStat }: QuickStatsRowProps) {
  return (
    <View style={styles.quickStatsRow}>
      {stats.map((stat) => (
        <QuickStatCard
          key={stat.label}
          stat={stat}
          isRtl={isRtl}
          onPress={onPressStat}
        />
      ))}
    </View>
  );
}
