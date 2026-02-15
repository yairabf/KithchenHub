import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export interface EmptyStateProps {
  /**
   * Ionicons icon name to display
   */
  icon: IoniconsName;

  /**
   * Main title text
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action button label
   */
  actionLabel?: string;

  /**
   * Optional action button press handler
   */
  onActionPress?: () => void;

  /**
   * Icon color (defaults to textMuted)
   */
  iconColor?: string;

  /**
   * Action button background color (defaults to primary)
   */
  actionColor?: string;
}
