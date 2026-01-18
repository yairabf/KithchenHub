import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isValidImageUrl } from '../../../utils/urlValidator';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { SafeImageProps } from './types';

/**
 * SafeImage - A secure image component with error handling and fallback display
 *
 * Features:
 * - URL validation to prevent XSS attacks
 * - Automatic error handling with fallback icon
 * - Customizable fallback icon
 * - Consistent styling
 *
 * @example
 * // Basic usage
 * <SafeImage uri="https://example.com/image.jpg" />
 *
 * @example
 * // Custom fallback
 * <SafeImage
 *   uri={item.image}
 *   fallbackIcon={<CustomIcon />}
 * />
 */
export function SafeImage({
  uri,
  style,
  fallbackIcon,
  fallbackIconSize = 24,
  fallbackIconColor = colors.textMuted,
  testID,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);

  // Check if URL is valid and safe
  const isValidImage = uri && isValidImageUrl(uri);

  // Show image if valid and no error occurred
  if (isValidImage && !imageError) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, style]}
        onError={() => setImageError(true)}
        testID={testID}
      />
    );
  }

  // Show fallback icon
  return (
    <View style={[styles.fallbackContainer, style]} testID={testID}>
      {fallbackIcon || (
        <Ionicons name="image-outline" size={fallbackIconSize} color={fallbackIconColor} />
      )}
    </View>
  );
}
