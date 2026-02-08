import React from 'react';
import { View } from 'react-native';
import { FloatingActionButton } from '../FloatingActionButton';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { HeaderActionsProps } from './types';

export function HeaderActions({
  onEditPress,
  onSharePress,
  onAddPress,
  editLabel = 'Edit',
  shareLabel = 'Share',
  addLabel = 'Add new item',
  hideAddButton = false,
}: HeaderActionsProps) {
  const hasEditButton = !!onEditPress;
  const hasShareButton = !!onSharePress;
  const hasAddButton = !hideAddButton && !!onAddPress;

  // Issue 7: Return null if no buttons to render
  if (!hasEditButton && !hasShareButton && !hasAddButton) {
    return null;
  }

  return (
    <View style={styles.container}>
      {hasEditButton && (
        <FloatingActionButton
          onPress={onEditPress}
          iconName="create-outline"
          backgroundColor={colors.secondary}
          accessibilityLabel={editLabel}
        />
      )}
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
