import React from 'react';
import { Image } from 'react-native';
import { GroceryCardContent } from './GroceryCardContent';
import { getCategoryImageSource } from '../../../features/shopping/utils/categoryImage';
import type { GroceryItemContentProps } from './types';

/**
 * Shared grocery item content.
 *
 * This is intentionally wrapper-free: shopping rows can place it inside a
 * swipeable/tappable shopping wrapper, while recipe ingredient rows can place
 * the exact same content inside a static ingredient wrapper.
 */
export function GroceryItemContent({
  item,
  imageTestID,
  imageStyle,
  categoryFallbackTestID,
  categoryFallbackImageStyle,
  fallbackIcon,
  iconContainerStyle,
  titleStyle,
  subtitle,
  rightElement,
  imagePosition = 'left',
  onPress,
  isRtl,
}: GroceryItemContentProps) {
  const normalizedCategory = item.category?.trim();
  const categoryImageSource = normalizedCategory
    ? getCategoryImageSource(normalizedCategory)
    : null;

  const customIcon = categoryImageSource ? (
    <Image
      source={categoryImageSource}
      style={categoryFallbackImageStyle}
      resizeMode="contain"
      testID={categoryFallbackTestID}
    />
  ) : fallbackIcon;

  return (
    <GroceryCardContent
      image={item.image}
      imageTestID={imageTestID}
      imageStyle={imageStyle}
      customIcon={customIcon}
      iconContainerStyle={iconContainerStyle}
      title={item.name}
      titleStyle={titleStyle}
      subtitle={subtitle}
      rightElement={rightElement}
      imagePosition={imagePosition}
      onPress={onPress}
      isRtl={isRtl}
    />
  );
}
