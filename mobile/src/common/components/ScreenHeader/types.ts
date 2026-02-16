import { ReactNode } from 'react';

export interface ScreenHeaderProps {
  title: string;
  titleIcon?: import('react').ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
  subtitle?: string;
  leftIcon?: 'back' | 'home' | 'none';
  onLeftPress?: () => void;
  rightActions?: {
    edit?: { onPress: () => void; label?: string };
    share?: { onPress: () => void; label?: string };
    add?: { onPress: () => void; label?: string };
  };
  rightSlot?: ReactNode;
  variant?: 'default' | 'centered';
  /** Optional children to render below title/subtitle (e.g., stats, metadata) */
  children?: ReactNode;
}
