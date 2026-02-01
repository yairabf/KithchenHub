import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { styles } from './styles';
import { CenteredModalProps } from './types';

/**
 * CenteredModal - A reusable centered modal component with consistent styling
 *
 * Features:
 * - Centered positioning with backdrop
 * - Fade + scale animations
 * - Standard header with title and close button
 * - Optional action buttons (Cancel + Confirm)
 * - Customizable confirm button color for context (shopping/chores/recipes)
 *
 * Usage:
 * ```tsx
 * <CenteredModal
 *   visible={showModal}
 *   onClose={handleClose}
 *   title="Add Item"
 *   confirmText="Add"
 *   onConfirm={handleAdd}
 *   confirmColor={colors.shopping}
 * >
 *   <View>{/* Your custom content *\/}</View>
 * </CenteredModal>
 * ```
 */
export function CenteredModal({
  visible,
  onClose,
  title,
  children,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onConfirm,
  confirmColor = colors.primary,
  showActions = true,
  confirmDisabled = false,
  confirmLoading = false,
}: CenteredModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.modalContent, animatedModalStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>{children}</View>

            {/* Actions */}
            {showActions && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: confirmColor },
                    (confirmDisabled || confirmLoading) && styles.confirmButtonDisabled,
                  ]}
                  onPress={onConfirm}
                  disabled={confirmDisabled || confirmLoading}
                >
                  <View style={styles.confirmContent}>
                    {confirmLoading ? (
                      <ActivityIndicator size="small" color={colors.textLight} />
                    ) : null}
                    <Text style={styles.confirmText}>{confirmText}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
