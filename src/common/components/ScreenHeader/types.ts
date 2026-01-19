export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: 'back' | 'home' | 'none';
  onLeftPress?: () => void;
  rightActions?: {
    share?: { onPress: () => void; label?: string };
    add?: { onPress: () => void; label?: string };
  };
  variant?: 'default' | 'centered';
}
