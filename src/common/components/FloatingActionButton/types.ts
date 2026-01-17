import { Ionicons } from '@expo/vector-icons';

export interface FloatingActionButtonProps {
  label: string;
  onPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  bottomOffset?: number;
}
