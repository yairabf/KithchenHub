import { Ionicons } from '@expo/vector-icons';

export interface NavButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  isPhone?: boolean;
  onPress: () => void;
}
