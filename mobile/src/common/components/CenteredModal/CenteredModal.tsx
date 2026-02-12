import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  AccessibilityInfo,
  findNodeHandle,
  Platform,
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
  triggerRef,
}: CenteredModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const modalTitleRef = useRef<Text>(null);

  // Manage animations
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  // Focus management - set initial focus when modal opens
  useEffect(() => {
    if (visible && modalTitleRef.current) {
      // Delay to allow modal animation to complete
      const timer = setTimeout(() => {
        const reactTag = findNodeHandle(modalTitleRef.current);
        if (reactTag && Platform.OS !== 'web') {
          AccessibilityInfo.setAccessibilityFocus(reactTag);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Focus management - return focus to trigger when modal closes
  useEffect(() => {
    if (!visible && triggerRef?.current) {
      // Delay to allow modal close animation to complete
      const timer = setTimeout(() => {
        const reactTag = findNodeHandle(triggerRef.current);
        if (reactTag && Platform.OS !== 'web') {
          AccessibilityInfo.setAccessibilityFocus(reactTag);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [visible, triggerRef]);

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

        <Animated.View
          style={[styles.modalContent, animatedModalStyle]}
          accessibilityViewIsModal={true}
          importantForAccessibility="yes"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text
                ref={modalTitleRef}
                style={styles.title}
                accessibilityRole="header"
                accessible={true}
              >
                {title}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
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
