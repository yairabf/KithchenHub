import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from '../SkeletonLoader';
import { spacing, borderRadius } from '../../../theme';
import { styles } from './styles';
import type { ListItemSkeletonProps } from './types';

export function ListItemSkeleton({ style }: ListItemSkeletonProps = {}) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon/Image placeholder */}
      <SkeletonLoader
        width={48}
        height={48}
        borderRadius={borderRadius.md}
      />

      {/* Text content placeholder */}
      <View style={styles.textContainer}>
        <SkeletonLoader
          width={180}
          height={16}
          borderRadius={borderRadius.xs}
          style={{ marginBottom: spacing.xs }}
        />
        <SkeletonLoader
          width={120}
          height={14}
          borderRadius={borderRadius.xs}
        />
      </View>

      {/* Action/checkbox placeholder */}
      <SkeletonLoader
        width={24}
        height={24}
        borderRadius={borderRadius.full}
      />
    </View>
  );
}
