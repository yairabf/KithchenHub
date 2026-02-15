import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { styles } from './styles';
import { ButtonProps } from './types';

/**
 * Unified Button component with consistent styling and behavior
 *
 * Features:
 * - Multiple variants (primary, secondary, outline, danger, ghost)
 * - Multiple sizes (small, medium, large)
 * - Loading and disabled states
 * - Optional icon support
 * - Full accessibility support
 * - Consistent spacing and typography
 *
 * Usage:
 * ```tsx
 * <Button
 *   title="Save Changes"
 *   onPress={handleSave}
 *   variant="primary"
 *   size="medium"
 *   loading={isSaving}
 * />
 * ```
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  color,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Get variant-specific styles
  const variantStyle = styles[`${variant}Button`];
  const variantTextStyle = styles[`${variant}ButtonText`];

  // Get size-specific styles
  const sizeStyle = styles[`${size}Button`];
  const sizeTextStyle = styles[`${size}ButtonText`];

  // Apply custom color for primary variant
  const customColorStyle = color && variant === 'primary' ? { backgroundColor: color } : {};

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        customColorStyle,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={variant === 'outline' || variant === 'ghost' ? colors.textPrimary : colors.textLight}
            style={styles.spinner}
          />
        ) : icon ? (
          <Ionicons
            name={icon as any}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'outline' || variant === 'ghost' ? colors.textPrimary : colors.textLight}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.buttonText, variantTextStyle, sizeTextStyle]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
