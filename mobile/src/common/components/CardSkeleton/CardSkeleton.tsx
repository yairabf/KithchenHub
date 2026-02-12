import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from '../SkeletonLoader';
import { spacing, borderRadius } from '../../../theme';
import { styles } from './styles';
import type { CardSkeletonProps } from './types';

export function CardSkeleton({ width, style }: CardSkeletonProps) {
  // Card aspect ratio similar to RecipeCard
  const cardHeight = width * 1.3;
  const imageHeight = width * 0.6;

  return (
    <View style={[styles.container, { width }, style]}>
      {/* Image placeholder */}
      <SkeletonLoader
        width={width}
        height={imageHeight}
        borderRadius={borderRadius.xxl}
      />

      {/* Text content placeholder */}
      <View style={styles.textContainer}>
        <SkeletonLoader
          width={width * 0.8}
          height={18}
          borderRadius={borderRadius.xs}
          style={{ marginBottom: spacing.xs }}
        />
        <SkeletonLoader
          width={width * 0.5}
          height={14}
          borderRadius={borderRadius.xs}
        />
      </View>
    </View>
  );
}
