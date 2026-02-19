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

/**
 * RTL-aware title + subtitle block.
 *
 * On LTR layouts it renders a plain column of two Text nodes.
 * On RTL layouts it wraps each Text in a flex row so that `justifyContent:
 * flex-start` pushes the content to the visual right (the logical start in
 * RTL), working around iOS's inconsistent handling of `textAlign: "right"`.
 *
 * Callers provide per-slot style overrides so the component can be used
 * with any design system without leaking its own styling.
 *
 * @example
 * ```tsx
 * <TextBlock
 *   title="Shopping"
 *   subtitle="Add items to your list"
 *   isRtl={isRtlLayout}
 *   containerStyle={styles.titleBlock}
 *   containerRtlStyle={styles.titleBlockRtl}
 *   titleStyle={styles.title}
 *   titleRtlStyle={styles.titleRtl}
 *   subtitleStyle={styles.subtitle}
 *   subtitleRtlStyle={styles.subtitleRtl}
 * />
 * ```
 */
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
