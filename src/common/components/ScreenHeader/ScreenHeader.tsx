import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeaderProps } from './types';
import { styles } from './styles';
import { colors } from '../../../theme';
import { HeaderActions } from '../HeaderActions';

/**
 * ScreenHeader - Unified header component for all app screens
 *
 * Provides consistent styling and layout for screen headers with optional
 * left navigation icon, title/subtitle, and right action buttons.
 *
 * @example
 * // Simple title only
 * <ScreenHeader title="Settings" />
 *
 * @example
 * // With subtitle and actions
 * <ScreenHeader
 *   title="Shopping List"
 *   subtitle="12 items total"
 *   rightActions={{
 *     share: { onPress: handleShare, label: 'Share list' },
 *     add: { onPress: handleAdd, label: 'Add item' },
 *   }}
 * />
 *
 * @example
 * // Centered with back button (for detail screens)
 * <ScreenHeader
 *   title="KITCHEN HUB"
 *   leftIcon="back"
 *   onLeftPress={goBack}
 *   variant="centered"
 * />
 *
 * @example
 * // With home icon and actions
 * <ScreenHeader
 *   title="HOME CHORES"
 *   leftIcon="home"
 *   onLeftPress={goHome}
 *   rightActions={{
 *     share: { onPress: handleShare, label: 'Share chores' },
 *     add: { onPress: handleAdd, label: 'Add chore' },
 *   }}
 * />
 */
export function ScreenHeader({
  title,
  subtitle,
  leftIcon = 'none',
  onLeftPress,
  rightActions,
  variant = 'default',
}: ScreenHeaderProps) {
  const renderLeftIcon = () => {
    // Don't render icon if it's 'none' or if there's no press handler
    if (leftIcon === 'none' || !onLeftPress) return null;

    const iconName = leftIcon === 'back' ? 'arrow-back' : 'home-outline';
    const accessibilityLabel = leftIcon === 'back' ? 'Go back' : 'Go to home';

    return (
      <TouchableOpacity
        style={styles.leftIconButton}
        onPress={onLeftPress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name={iconName} size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderTitle = () => {
    if (variant === 'centered') {
      return (
        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
        </View>
      );
    }

    return (
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderRightActions = () => {
    if (!rightActions) return null;

    const { share, add } = rightActions;

    // Don't render wrapper if no actual actions are provided
    if (!share && !add) return null;

    return (
      <View style={styles.rightSection}>
        <HeaderActions
          onSharePress={share?.onPress}
          onAddPress={add?.onPress}
          shareLabel={share?.label}
          addLabel={add?.label}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {variant === 'centered' ? (
        <>
          {renderLeftIcon()}
          {renderTitle()}
          {renderRightActions()}
        </>
      ) : (
        <>
          <View style={styles.leftSection}>
            {renderLeftIcon()}
            {renderTitle()}
          </View>
          {renderRightActions()}
        </>
      )}
    </View>
  );
}
