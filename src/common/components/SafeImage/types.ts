import type { ImageStyle, StyleProp } from 'react-native';

/**
 * Props for SafeImage component
 * A secure image component with error handling and fallback display
 */
export interface SafeImageProps {
  /**
   * Image URL to display. Must be a valid HTTP/HTTPS URL.
   * Will be validated before rendering.
   */
  uri?: string;

  /**
   * Custom style for the image container
   */
  style?: StyleProp<ImageStyle>;

  /**
   * Custom fallback icon to display when image fails or URL is invalid
   * If not provided, defaults to a generic image icon
   */
  fallbackIcon?: React.ReactNode;

  /**
   * Size for the default fallback icon
   * @default 24
   */
  fallbackIconSize?: number;

  /**
   * Color for the default fallback icon
   * @default colors.textMuted
   */
  fallbackIconColor?: string;

  /**
   * Test ID for automated testing
   */
  testID?: string;
}
