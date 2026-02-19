import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { styles } from "./styles";

interface TitleSubtitleWrapperProps {
  children: React.ReactNode;
  isRtl: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Layout wrapper that applies RTL direction to a title/subtitle column.
 * Used as an inner container inside TextBlock to align the text block
 * to the correct visual edge in RTL layouts.
 */
export function TitleSubtitleWrapper({
  children,
  isRtl,
  style,
}: TitleSubtitleWrapperProps) {
  return (
    <View
      style={[
        styles.titleSubtitleWrapper,
        isRtl && styles.titleSubtitleWrapperRtl,
        style,
      ]}
    >
      {children}
    </View>
  );
}
