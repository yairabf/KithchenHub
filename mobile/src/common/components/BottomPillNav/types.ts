import { Ionicons } from '@expo/vector-icons';

export type TabKey = 'Dashboard' | 'Shopping' | 'Recipes' | 'Chores' | 'Settings';

export interface NavItem {
  key: TabKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
}

export interface BottomPillNavProps {
  activeTab: TabKey;
  onTabPress: (tabKey: TabKey) => void;
}
