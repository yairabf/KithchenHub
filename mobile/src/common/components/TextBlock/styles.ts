import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  titleSubtitleWrapper: {
    width: "100%",
  },
  titleSubtitleWrapperRtl: {
    direction: "rtl",
    alignSelf: "stretch",
  },
  /**
   * RTL text row container.
   * flexDirection: "row" + justifyContent: "flex-start" positions content at
   * the visual start of the row. In RTL layout the start is on the right,
   * so this naturally right-aligns text on iOS without relying on textAlign.
   */
  rtlTextRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    width: "100%",
  },
});
