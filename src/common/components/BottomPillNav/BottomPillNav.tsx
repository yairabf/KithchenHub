import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavButton } from '../NavButton';
import { spacing } from '../../../theme';
import { styles } from './styles';
import { BottomPillNavProps, NavItem } from './types';

const navItems: NavItem[] = [
  { key: 'Dashboard', icon: 'home-outline', iconActive: 'home', label: 'HOME' },
  { key: 'Shopping', icon: 'cart-outline', iconActive: 'cart', label: 'SHOPPING LIST' },
  { key: 'Chores', icon: 'checkbox-outline', iconActive: 'checkbox', label: 'CHORES' },
  { key: 'Recipes', icon: 'book-outline', iconActive: 'book', label: 'RECIPES' },
  { key: 'Settings', icon: 'person-outline', iconActive: 'person', label: 'PROFILE' },
];

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
