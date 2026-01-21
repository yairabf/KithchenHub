import React from 'react';
import { View } from 'react-native';
import { FloatingActionButton } from '../FloatingActionButton';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { HeaderActionsProps } from './types';

export function HeaderActions({
  onSharePress,
  onAddPress,
  shareLabel = 'Share',
  addLabel = 'Add new item',
  hideAddButton = false,
}: HeaderActionsProps) {
  const hasShareButton = !!onSharePress;
  const hasAddButton = !hideAddButton && !!onAddPress;

  // Issue 7: Return null if no buttons to render
  if (!hasShareButton && !hasAddButton) {
    return null;
  }

  return (
    <View style={styles.container}>
      {hasShareButton && (
        <FloatingActionButton
          onPress={onSharePress}
          iconName="share-outline"
          backgroundColor={colors.secondary}
          accessibilityLabel={shareLabel}
        />
      )}
      {hasAddButton && (
        <FloatingActionButton
          onPress={onAddPress}
          accessibilityLabel={addLabel}
        />
      )}
    </View>
  );
}
