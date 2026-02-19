import React from "react";
import {
  View,
  Text,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { styles } from "./styles";
import { TitleSubtitleWrapper } from "./TitleSubtitleWrapper";

interface TextBlockProps {
  title: string;
  subtitle: string;
  isRtl: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  containerRtlStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  titleRtlStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  subtitleRtlStyle?: StyleProp<TextStyle>;
}

export function TextBlock({
  title,
  subtitle,
  isRtl,
  containerStyle,
  containerRtlStyle,
  titleStyle,
  titleRtlStyle,
  subtitleStyle,
  subtitleRtlStyle,
}: TextBlockProps) {
  const TextWrapper = isRtl
    ? ({ children }: { children: React.ReactNode }) => (
        <View style={styles.rtlTextRow}>{children}</View>
      )
    : React.Fragment;

  return (
    <View style={[containerStyle, isRtl && containerRtlStyle]}>
      <TitleSubtitleWrapper isRtl={isRtl}>
        <TextWrapper>
          <Text style={[titleStyle, isRtl && titleRtlStyle]}>{title}</Text>
        </TextWrapper>
        <TextWrapper>
          <Text style={[subtitleStyle, isRtl && subtitleRtlStyle]}>{subtitle}</Text>
        </TextWrapper>
      </TitleSubtitleWrapper>
    </View>
  );
}
