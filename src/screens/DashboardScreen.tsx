import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { TabKey } from '../components/navigation';
import { colors, spacing, borderRadius } from '../theme';

interface DashboardScreenProps {
  onOpenShoppingModal: (buttonPosition?: { x: number; y: number; width: number; height: number }) => void;
  onOpenChoresModal: () => void;
  onNavigateToTab: (tab: TabKey) => void;
}

export function DashboardScreen({ onOpenShoppingModal, onOpenChoresModal, onNavigateToTab }: DashboardScreenProps) {
  const { user } = useAuth();
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="grid" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>Kitchen Hub</Text>
        </View>

        {/* Search Bar */}
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

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileRole}>KITCHEN LEAD</Text>
              <Text style={styles.profileName}>{user?.name || 'Jessica J.'}</Text>
            </View>
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Manage your home seamlessly.</Text>
          </View>
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainGrid}>
          {/* Left Column - Overview Section */}
          <View style={styles.leftColumn}>
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
          <View style={styles.rightColumn}>
            <View style={styles.widgetsRow}>
              <TouchableOpacity
                ref={shoppingButtonRef}
                style={styles.widgetCard}
                onPress={() => {
                  shoppingButtonRef.current?.measureInWindow((x, y, width, height) => {
                    onOpenShoppingModal({ x, y, width, height });
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.widgetIconContainer}>
                  <Ionicons name="basket-outline" size={48} color={colors.textSecondary} />
                </View>
                <Text style={styles.widgetLabel}>Shopping</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.widgetCard}
                onPress={onOpenChoresModal}
                activeOpacity={0.8}
              >
                <View style={styles.widgetIconContainer}>
                  <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
                </View>
                <Text style={styles.widgetLabel}>Chores</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: spacing.md,
    letterSpacing: -0.5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.widgetBackground,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'flex-end',
  },
  profileRole: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#EEF2FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1.2,
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  overviewCards: {
    gap: spacing.md,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: borderRadius.xxxl,
    paddingVertical: spacing.md,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  overviewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  overviewIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  overviewTextContainer: {
    gap: spacing.xs,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  overviewSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addWidgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.pill,
  },
  addWidgetText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  widgetCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.widgetBackground,
    borderRadius: borderRadius.pill,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  widgetIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.surfaceGlass,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  widgetLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
});
