import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  addedBy?: string;
  fromRecipe?: string;
}

const mockItems: ShoppingItem[] = [
  { id: '1', name: 'Apples', quantity: '6', category: 'Fruits & Vegetables', checked: false, addedBy: 'Mom' },
  { id: '2', name: 'Bananas', quantity: '1 bunch', category: 'Fruits & Vegetables', checked: true, addedBy: 'Dad' },
  { id: '3', name: 'Tomatoes', quantity: '4', category: 'Fruits & Vegetables', checked: false, addedBy: 'You' },
  { id: '4', name: 'Milk', quantity: '1L', category: 'Dairy', checked: false, addedBy: 'Mom' },
  { id: '5', name: 'Cheese', quantity: '', category: 'Dairy', checked: false },
  { id: '6', name: 'Flour', quantity: '2 cups', category: 'From Recipe: Pancakes', checked: false, fromRecipe: 'Pancakes' },
  { id: '7', name: 'Eggs', quantity: '3', category: 'From Recipe: Pancakes', checked: false, fromRecipe: 'Pancakes' },
];

export function SingleListScreen({ route, navigation }: any) {
  const { listName } = route.params;
  const [items, setItems] = useState(mockItems);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="people-outline" size={22} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={22} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.collaboratorBar}>
        <Ionicons name="people" size={16} color={colors.secondary} />
        <Text style={styles.collaboratorText}>Shared with: Mom, Dad (editing)</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {categoryItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.checked ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={item.checked ? colors.shopping : colors.textSecondary}
                />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, item.checked && styles.itemChecked]}>
                    {item.name} {item.quantity && `(${item.quantity})`}
                  </Text>
                </View>
                {item.addedBy && (
                  <Text style={styles.addedBy}>👤{item.addedBy}</Text>
                )}
                {item.fromRecipe && (
                  <Text style={styles.fromRecipe}>📖</Text>
                )}
                <TouchableOpacity style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear Checked Items</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.textLight} />
      </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.shopping,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textLight,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  collaboratorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.secondary}15`,
  },
  collaboratorText: {
    ...typography.caption,
    color: colors.secondary,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemName: {
    ...typography.body,
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  addedBy: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  fromRecipe: {
    marginRight: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.shopping,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
