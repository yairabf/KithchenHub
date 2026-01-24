import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeImage } from '../SafeImage';
import { styles } from './styles';
import type { GroceryCardContentProps } from './types';

/**
 * Flexible content layout component
 * Handles all layout variations (image/no-image, different right actions)
 */
export function GroceryCardContent({
  image,
  customIcon,
  title,
  titleStyle,
  subtitle,
  rightElement,
  imagePosition = 'left',
  onPress,
}: GroceryCardContentProps) {
  const content = (
    <>
      {/* Left side: Image or custom icon */}
      {imagePosition === 'left' && (
        <>
          {image ? (
            <SafeImage
              uri={image}
              style={styles.itemImage}
              fallbackIcon={customIcon}
            />
          ) : customIcon ? (
            <View style={styles.iconContainer}>{customIcon}</View>
          ) : null}
        </>
      )}

      {/* Middle content: Title and subtitle */}
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, titleStyle]}>{title}</Text>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
          ) : (
            subtitle
          )
        )}
      </View>

      {/* Right action element */}
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.contentRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.contentRow}>{content}</View>;
}
