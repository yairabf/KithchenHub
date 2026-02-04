import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { GrocerySearchBarProps, GroceryItem } from './types';
import { DEFAULT_CATEGORY, normalizeShoppingCategory } from '../../constants/categories';
import { useTranslation } from 'react-i18next';
import { compareGroceryItemsForSearch } from './searchSortingUtils';

export function GrocerySearchBar({
  items,
  onSelectItem,
  onQuickAddItem,
  placeholder = 'Search groceries to add...',
  variant = 'surface',
  showShadow = true,
  maxResults = 8,
  allowCustomItems = false,
  value,
  onChangeText,
  containerStyle,
  dropdownStyle,
}: GrocerySearchBarProps) {
  // Internal state for uncontrolled mode
  const [internalQuery, setInternalQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isSelectingRef = useRef(false);
  const { t } = useTranslation();

  // Use controlled value if provided, otherwise use internal state
  const searchQuery = value !== undefined ? value : internalQuery;
  const handleQueryChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setInternalQuery(text);
    }
  };

  // Search logic with filtering and sorting
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return [];
    
    const normalizedQuery = trimmedQuery.toLowerCase();
    
    // Filter items that match the query
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    );
    
    // Sort results with custom items prioritized, especially exact matches
    // Create a copy to avoid mutating the filtered array
    const sorted = [...filtered].sort((a, b) =>
      compareGroceryItemsForSearch(a, b, normalizedQuery)
    );
    
    return sorted.slice(0, maxResults);
  }, [searchQuery, items, maxResults]);

  // Create custom item option when custom items are allowed and there's a query
  const customItem = useMemo((): GroceryItem | null => {
    if (!allowCustomItems || !searchQuery.trim()) {
      return null;
    }
    const trimmedQuery = searchQuery.trim();
    // Use stable ID based on query content to prevent re-render issues
    const stableId = `custom-${trimmedQuery.toLowerCase().replace(/\s+/g, '-')}`;
    // Category will be set in the modal, use default for now
    const normalizedCategory = normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase());
    
    return {
      id: stableId,
      name: trimmedQuery,
      image: '', // Empty string - handled by customItemIcon styling
      category: normalizedCategory, // Default category, will be updated in modal
      defaultQuantity: 1,
    };
  }, [allowCustomItems, searchQuery]);

  // Show/hide dropdown based on search results or custom item availability
  useEffect(() => {
    const hasQuery = searchQuery.trim().length > 0;
    const hasResults = searchResults.length > 0;
    const hasCustom = customItem !== null;
    setShowDropdown(hasQuery && (hasResults || hasCustom));
  }, [searchQuery, searchResults, customItem]);

  const handleSelectItem = (item: GroceryItem) => {
    isSelectingRef.current = true;
    onSelectItem(item);
    // Keep dropdown open so user can continue adding items
  };

  const handleQuickAdd = (item: GroceryItem) => {
    isSelectingRef.current = true;
    onQuickAddItem(item);
    // Keep dropdown open for rapid multi-item addition
  };

  const handleClear = () => {
    handleQueryChange('');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside - use blur event with ref guard
  const handleInputBlur = () => {
    // Delay to allow click events on dropdown items to process first
    // Increased timeout to 200ms to ensure button clicks complete
    setTimeout(() => {
      const wasSelecting = isSelectingRef.current;
      // Always reset the ref
      isSelectingRef.current = false;
      // Only close dropdown if user was NOT selecting an item
      if (!wasSelecting) {
        setShowDropdown(false);
      }
    }, 200);
  };

  const handleInputFocus = () => {
    // Reopen dropdown if there's content
    if (searchQuery.trim().length > 0) {
      const hasResults = searchResults.length > 0;
      const hasCustom = customItem !== null;
      if (hasResults || hasCustom) {
        setShowDropdown(true);
      }
    }
  };

  // Determine search bar style based on variant
  const searchBarStyle = [
    styles.searchBar,
    variant === 'surface' ? styles.searchBarSurface : styles.searchBarBackground,
    showShadow && styles.searchBarShadow,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={searchBarStyle}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleQueryChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <View style={[styles.searchDropdown, dropdownStyle]}>
          <ScrollView
            style={styles.searchDropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* Custom Item Option (shown when no results match) */}
            {customItem && (
              <View key={customItem.id} style={[styles.searchResultItem, styles.customItemRow]}>
                <TouchableOpacity
                  style={styles.searchResultContent}
                  onPress={() => handleSelectItem(customItem)}
                  onPressIn={() => { isSelectingRef.current = true; }}
                >
                  <View style={styles.customItemIcon}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.shopping} />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>Add "{customItem.name}"</Text>
                    <Text style={styles.searchResultCategory}>Custom Item</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addIconButton}
                  onPress={() => handleQuickAdd(customItem)}
                  onPressIn={() => { isSelectingRef.current = true; }}
                >
                  <Ionicons name="add-circle" size={28} color={colors.shopping} />
                </TouchableOpacity>
              </View>
            )}

            {/* Database Results */}
            {searchResults.map((item) => (
              <View key={item.id} style={styles.searchResultItem}>
                <TouchableOpacity
                  style={styles.searchResultContent}
                  onPress={() => handleSelectItem(item)}
                  onPressIn={() => { isSelectingRef.current = true; }}
                >
                  <Image source={{ uri: item.image }} style={styles.searchResultImage} />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultCategory}>{item.category}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addIconButton}
                  onPress={() => handleQuickAdd(item)}
                  onPressIn={() => { isSelectingRef.current = true; }}
                >
                  <Ionicons name="add-circle" size={28} color={colors.shopping} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
