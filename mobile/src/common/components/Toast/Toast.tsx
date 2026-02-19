import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { ToastProps, ToastType } from './types';

const ANIMATION_DURATION = 300;
const DEFAULT_TOAST_DURATION = 2500;

const getIcon = (type: ToastType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'success':
      return 'checkmark';
    case 'error':
      return 'close';
    case 'info':
    default:
      return 'information';
  }
};

const getIconContainerStyle = (type: ToastType) => {
  switch (type) {
    case 'error':
      return styles.iconContainerError;
    case 'info':
      return styles.iconContainerInfo;
    case 'success':
    default:
      return null;
  }
};

export function Toast({
  visible,
  message,
  type = 'success',
  duration = DEFAULT_TOAST_DURATION,
  onHide,
}: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const [isMounted, setIsMounted] = useState(false);
  const isComponentMountedRef = useRef(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unmountToast = useCallback(() => {
    if (!isComponentMountedRef.current) {
      return;
    }
    setIsMounted(false);
  }, []);

  const hideAndNotify = useCallback(() => {
    if (!isComponentMountedRef.current) {
      return;
    }
    onHide();
    setIsMounted(false);
  }, [onHide]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (visible) {
      setIsMounted(true);
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION });

      hideTimerRef.current = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: ANIMATION_DURATION });
        opacity.value = withTiming(0, { duration: ANIMATION_DURATION }, () => {
          runOnJS(hideAndNotify)();
        });
      }, duration);

      return;
    } else {
      translateY.value = withTiming(-100, { duration: ANIMATION_DURATION });
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION }, () => {
        runOnJS(unmountToast)();
      });
    }
  }, [visible, duration, hideAndNotify, unmountToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isMounted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.toast, animatedStyle]}>
        <View style={[styles.iconContainer, getIconContainerStyle(type)]}>
          <Ionicons name={getIcon(type)} size={14} color="white" />
        </View>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}
