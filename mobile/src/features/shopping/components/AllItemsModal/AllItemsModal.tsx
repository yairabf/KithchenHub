import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
  AccessibilityInfo,
  findNodeHandle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { AllItemsModalProps, GroceryItem } from './types';
import { useDebouncedRemoteSearch } from '../../../../common/hooks';

export function AllItemsModal({
  visible,
  items,
  onClose,
  onSelectItem,
  onQuickAddItem,
  searchGroceries,
}: AllItemsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const titleRef = useRef<Text>(null);

  const { results: searchResults, isSearching } = useDebouncedRemoteSearch<GroceryItem>({
    query: searchQuery,
    searchFn: searchGroceries,
    enabled: !!searchGroceries,
    onError: (error) => {
      console.error('All items search failed:', error);
    },
  });

  // Set initial focus when modal opens
  useEffect(() => {
    if (visible && titleRef.current) {
      const timer = setTimeout(() => {
        const reactTag = findNodeHandle(titleRef.current);
        if (reactTag && Platform.OS !== 'web') {
          AccessibilityInfo.setAccessibilityFocus(reactTag);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  console.log('AllItemsModal render - visible:', visible, 'items count:', items.length);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    // If using remote search, use search results
    if (searchGroceries) {
      return searchResults;
    }

    // Otherwise filter locally
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [items, searchQuery, searchResults, searchGroceries]);

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
        <Animated.View
          style={styles.sidePanel}
          accessibilityViewIsModal={true}
          importantForAccessibility="yes"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text
                ref={titleRef}
                style={styles.headerTitle}
                accessibilityRole="header"
                accessible={true}
              >
                All Items
              </Text>
              <Text style={styles.headerSubtitle}>{filteredItems.length} items</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close all items modal"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
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
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Category Items */}
                    {isExpanded && (
                      <View style={styles.categoryItems}>
                        {categoryItems.map((item) => (
                          <View
                            key={item.id}
                            style={styles.itemCard}
                          >
                            <TouchableOpacity
                              style={styles.itemContent}
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
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => {
                                if (onQuickAddItem) {
                                  onQuickAddItem(item);
                                } else {
                                  onSelectItem(item);
                                  handleClose();
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="add-circle" size={28} color={colors.primary} />
                            </TouchableOpacity>
                          </View>
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
