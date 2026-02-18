import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { styles } from "./styles";

interface TitleSubtitleWrapperProps {
  children: React.ReactNode;
  isRtl: boolean;
  style?: StyleProp<ViewStyle>;
}

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
