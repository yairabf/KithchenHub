import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Screen-specific colors matching ShoppingListsScreen
const screenColors = {
  background: '#F5F5F0',
  surface: '#FFFFFF',
  textPrimary: '#2D3139',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  accent: '#10B981',
  quantityBg: '#F3F4F6',
};

interface GroceryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  defaultQuantity: number;
}

interface AllItemsModalProps {
  visible: boolean;
  items: GroceryItem[];
  onClose: () => void;
  onSelectItem: (item: GroceryItem) => void;
}

export function AllItemsModal({
  visible,
  items,
  onClose,
  onSelectItem,
}: AllItemsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  console.log('AllItemsModal render - visible:', visible, 'items count:', items.length);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categories = Object.keys(groupedItems).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleClose = () => {
    setSearchQuery('');
    setExpandedCategories(new Set());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Side Panel */}
        <Animated.View style={styles.sidePanel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>All Items</Text>
              <Text style={styles.headerSubtitle}>{filteredItems.length} items</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={screenColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={screenColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={screenColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={screenColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={screenColors.textMuted} />
                <Text style={styles.emptyText}>No items found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            ) : (
              categories.map((category) => {
                const categoryItems = groupedItems[category];
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <View key={category} style={styles.categorySection}>
                    {/* Category Header */}
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => toggleCategory(category)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryHeaderLeft}>
                        <Text style={styles.categoryName}>{category}</Text>
                        <Text style={styles.categoryCount}>
                          {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={screenColors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Category Items */}
                    {isExpanded && (
                      <View style={styles.categoryItems}>
                        {categoryItems.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.itemCard}
                            onPress={() => {
                              onSelectItem(item);
                              handleClose();
                            }}
                            activeOpacity={0.7}
                          >
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <Text style={styles.itemCategory}>{item.category}</Text>
                            </View>
                            <View style={styles.addButton}>
                              <Ionicons name="add-circle" size={32} color={screenColors.accent} />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidePanel: {
    width: SCREEN_WIDTH * 0.75,
    maxWidth: 500,
    backgroundColor: screenColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: screenColors.border,
    backgroundColor: screenColors.surface,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: screenColors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: screenColors.textSecondary,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: screenColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: screenColors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: screenColors.textPrimary,
    height: 30,
  },
  scrollView: {
    flex: 1,
    backgroundColor: screenColors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: screenColors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: screenColors.textMuted,
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: screenColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeaderLeft: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: screenColors.textPrimary,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: screenColors.textMuted,
  },
  categoryItems: {
    gap: 8,
    paddingLeft: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: screenColors.quantityBg,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: screenColors.textPrimary,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    color: screenColors.textMuted,
  },
  addButton: {
    padding: 4,
  },
});
