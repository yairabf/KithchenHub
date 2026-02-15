import type { ViewStyle } from 'react-native';

export interface SkeletonLoaderProps {
  /**
   * Width of the skeleton element
   */
  width: number;

  /**
   * Height of the skeleton element
   */
  height: number;

  /**
   * Border radius of the skeleton element (defaults to 8)
   */
  borderRadius?: number;

  /**
   * Additional styles to apply
   */
  style?: ViewStyle;
}
