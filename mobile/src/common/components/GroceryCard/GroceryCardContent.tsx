import React from 'react';
import { View, Text, TouchableOpacity, I18nManager } from 'react-native';
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
  isRtl,
}: GroceryCardContentProps) {
  const isRtlLayout = isRtl ?? I18nManager.isRTL;

  const imageNode = imagePosition === 'left'
    ? (image ? (
      <SafeImage
        uri={image}
        style={styles.itemImage}
        fallbackIcon={customIcon}
      />
    ) : customIcon ? (
      <View style={styles.iconContainer}>{customIcon}</View>
    ) : null)
    : null;

  const detailsNode = (
    <View style={[styles.itemDetails, isRtlLayout && styles.itemDetailsRtl]}>
      <Text style={[styles.itemName, isRtlLayout && styles.itemNameRtl, titleStyle]}>{title}</Text>
      {subtitle && (
        typeof subtitle === 'string' ? (
          <Text style={[styles.itemSubtitle, isRtlLayout && styles.itemSubtitleRtl]}>{subtitle}</Text>
        ) : (
          <View style={isRtlLayout ? styles.subtitleNodeRtl : undefined}>{subtitle}</View>
        )
      )}
    </View>
  );

  const rightNode = rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null;
  const mainContentNode = isRtlLayout
    ? <View style={styles.mainContentRow}>{detailsNode}{imageNode}</View>
    : <View style={styles.mainContentRow}>{imageNode}{detailsNode}</View>;

  const content = (
    isRtlLayout
      ? <>{rightNode}{mainContentNode}</>
      : <>{mainContentNode}{rightNode}</>
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
