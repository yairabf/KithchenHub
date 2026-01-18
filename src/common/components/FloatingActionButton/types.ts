import { Ionicons } from '@expo/vector-icons';

/** FAB positioning modes */
export type FABPosition = 'inline' | 'bottom-center' | 'absolute-right';

export interface FloatingActionButtonProps {
  /** Handler called when button is pressed */
  onPress?: () => void;
  /** Ionicons icon name (default: 'add') */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Icon color (default: colors.textLight) */
  iconColor?: string;
  /** Button background color (default: colors.primary) */
  backgroundColor?: string;
  /** Positioning mode (default: 'inline') */
  position?: FABPosition;
  /** Top offset for absolute positioning */
  topOffset?: number;
  /** Right offset for absolute positioning */
  rightOffset?: number;
  /** Bottom offset for bottom-center positioning */
  bottomOffset?: number;
  /** Button diameter in pixels (default: 52) */
  size?: number;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}
