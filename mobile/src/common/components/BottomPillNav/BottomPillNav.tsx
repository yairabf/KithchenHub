import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavButton } from '../NavButton';
import { useResponsive } from '../../hooks/useResponsive';
import { spacing } from '../../../theme';
import { styles } from './styles';
import { BottomPillNavProps, NavItem } from './types';

type NavItemConfig = Omit<NavItem, 'label'> & { labelKey: string };

const navItemConfigs: NavItemConfig[] = [
  { key: 'Dashboard', icon: 'home-outline', iconActive: 'home', labelKey: 'navigation.home' },
  { key: 'Shopping', icon: 'cart-outline', iconActive: 'cart', labelKey: 'navigation.shop' },
  { key: 'Chores', icon: 'checkbox-outline', iconActive: 'checkbox', labelKey: 'navigation.chores' },
  { key: 'Recipes', icon: 'book-outline', iconActive: 'book', labelKey: 'navigation.recipes' },
  { key: 'Settings', icon: 'person-outline', iconActive: 'person', labelKey: 'navigation.profile' },
];

export function BottomPillNav({ activeTab, onTabPress }: BottomPillNavProps) {
  const insets = useSafeAreaInsets();
  const { isPhone } = useResponsive();
  const { t } = useTranslation('common');

  return (
    <View style={[
      styles.container,
      isPhone && styles.containerPhone,
      { paddingBottom: Math.max(insets.bottom, spacing.sm) }
    ]}>
      <View style={[styles.pill, isPhone && styles.pillPhone]}>
        {navItemConfigs.map((item) => (
          <NavButton
            key={item.key}
            icon={item.icon}
            iconActive={item.iconActive}
            label={t(item.labelKey)}
            isActive={activeTab === item.key}
            isPhone={isPhone}
            onPress={() => onTabPress(item.key)}
          />
        ))}
      </View>
    </View>
  );
}
