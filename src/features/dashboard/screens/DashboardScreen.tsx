import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useResponsive } from '../../../common/hooks';
import { colors } from '../../../theme';
import { styles } from './styles';
import type { DashboardScreenProps } from './types';
import type { TabKey } from '../../../common/components/BottomPillNav';

export function DashboardScreen({ onOpenShoppingModal, onOpenChoresModal, onNavigateToTab }: DashboardScreenProps) {
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const shoppingButtonRef = useRef<View>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const overviewItems = [
    { icon: 'basket-outline' as const, title: 'Shopping Lists', sub: '3 active lists', route: 'Shopping' as TabKey },
    { icon: 'clipboard-outline' as const, title: "Today's Chores", sub: '3 tasks pending', route: 'Chores' as TabKey },
    { icon: 'restaurant-outline' as const, title: 'Recipes', sub: '6 saved recipes', route: 'Recipes' as TabKey },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, !isTablet && styles.headerPhone]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="grid" size={20} color={colors.textLight} />
          </View>
          {isTablet && <Text style={styles.logoText}>Kitchen Hub</Text>}
        </View>

        {/* Search Bar - Only show inline on tablet */}
        {isTablet && (
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            {isTablet && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileRole}>KITCHEN LEAD</Text>
                <Text style={styles.profileName}>{user?.name || 'Jessica J.'}</Text>
              </View>
            )}
            <View style={styles.avatarContainer}>
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
              ) : (
                <Image
                  source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica' }}
                  style={styles.avatar}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Phone-only search bar below header */}
      {!isTablet && (
        <View style={styles.searchBarPhone}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Manage your home seamlessly.</Text>
          </View>
        </View>

        {/* Main Content Grid */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridPhone]}>
          {/* Left Column - Overview Section */}
          <View style={[styles.leftColumn, !isTablet && styles.fullWidthColumn]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <TouchableOpacity>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.overviewCards}>
              {overviewItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.overviewCard}
                  onPress={() => onNavigateToTab(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.overviewCardContent}>
                    <View style={styles.overviewIconContainer}>
                      <Ionicons name={item.icon} size={24} color={colors.textSecondary} />
                    </View>
                    <View style={styles.overviewTextContainer}>
                      <Text style={styles.overviewTitle}>{item.title}</Text>
                      <Text style={styles.overviewSub}>{item.sub}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addWidgetButton}>
                <Ionicons name="add" size={24} color={colors.textMuted} />
                <Text style={styles.addWidgetText}>Add Widget</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Column - Widgets Grid */}
          <View style={[styles.rightColumn, !isTablet && styles.fullWidthColumn]}>
            <View style={[styles.widgetsRow, !isTablet && styles.widgetsColumnPhone]}>
              <TouchableOpacity
                ref={shoppingButtonRef}
                style={[styles.widgetCard, !isTablet && styles.widgetCardPhone]}
                onPress={() => {
                  shoppingButtonRef.current?.measureInWindow((x, y, width, height) => {
                    onOpenShoppingModal({ x, y, width, height });
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.widgetIconContainer}>
                  <Ionicons name="basket-outline" size={34} color={colors.textSecondary} />
                </View>
                <Text style={[styles.widgetLabel, !isTablet && styles.widgetLabelPhone]} numberOfLines={3}>Add to Shopping List</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.widgetCard, !isTablet && styles.widgetCardPhone]}
                onPress={onOpenChoresModal}
                activeOpacity={0.8}
              >
                <View style={styles.widgetIconContainer}>
                  <Ionicons name="clipboard-outline" size={34} color={colors.textSecondary} />
                </View>
                <Text style={[styles.widgetLabel, !isTablet && styles.widgetLabelPhone]} numberOfLines={3}>Add New Chore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
