import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavButton } from './NavButton';
import { colors, borderRadius, spacing } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export type TabKey = 'Dashboard' | 'Shopping' | 'Recipes' | 'Chores' | 'Settings';

interface NavItem {
  key: TabKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
}

const navItems: NavItem[] = [
  { key: 'Dashboard', icon: 'home-outline', iconActive: 'home', label: 'HOME' },
  { key: 'Shopping', icon: 'cart-outline', iconActive: 'cart', label: 'SHOPPING LIST' },
  { key: 'Chores', icon: 'checkbox-outline', iconActive: 'checkbox', label: 'CHORES' },
  { key: 'Recipes', icon: 'book-outline', iconActive: 'book', label: 'RECIPES' },
  { key: 'Settings', icon: 'person-outline', iconActive: 'person', label: 'PROFILE' },
];

interface BottomPillNavProps {
  activeTab: TabKey;
  onTabPress: (tabKey: TabKey) => void;
}

export function BottomPillNav({ activeTab, onTabPress }: BottomPillNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.pill}>
        {navItems.map((item) => (
          <NavButton
            key={item.key}
            icon={item.icon}
            iconActive={item.iconActive}
            label={item.label}
            isActive={activeTab === item.key}
            onPress={() => onTabPress(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 48,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 4,
  },
});
