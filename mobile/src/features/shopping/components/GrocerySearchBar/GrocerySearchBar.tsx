import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { GrocerySearchBarProps, GroceryItem } from './types';
import { DEFAULT_CATEGORY, normalizeShoppingCategory } from '../../constants/categories';
import { compareGroceryItemsForSearch } from './searchSortingUtils';
import { useClickOutside } from '../../../../common/hooks/useClickOutside';

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
  const containerRef = useRef<View>(null);
  const dropdownRef = useRef<View>(null);

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

  /**
   * Handles closing the dropdown when clicking outside.
   * Uses the reusable useClickOutside hook for consistent behavior.
   */
  const handleCloseDropdown = useCallback(() => {
    setShowDropdown(false);
    inputRef.current?.blur();
  }, []);

  // Use reusable click-outside hook for consistent behavior
  useClickOutside({
    enabled: showDropdown,
    onOutsideClick: handleCloseDropdown,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    testId: 'grocery-search-container',
    dropdownRef: dropdownRef as React.RefObject<HTMLElement>,
    dropdownTestId: 'grocery-search-dropdown',
  });

  /**
   * Handles selection of a grocery item from the dropdown.
   * Calls the parent's onSelectItem callback and keeps dropdown open for multiple selections.
   * 
   * @param item - The grocery item that was selected
   */
  const handleSelectItem = (item: GroceryItem) => {
    onSelectItem(item);
    // Don't close dropdown - let user add more items
  };

  /**
   * Handles quick-add action for a grocery item (clicking + button).
   * Calls the parent's onQuickAddItem callback and keeps dropdown open for rapid additions.
   * 
   * @param item - The grocery item to quickly add
   */
  const handleQuickAdd = (item: GroceryItem) => {
    onQuickAddItem(item);
    // Don't close dropdown - let user add more items
  };

  const handleClear = () => {
    handleQueryChange('');
    setShowDropdown(false);
  };

  // Don't close dropdown on blur - only close on outside click
  const handleInputBlur = () => {
    // Do nothing - click-outside handler manages closing
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

  /**
   * Handles backdrop press events to close the dropdown.
   */
  const handleBackdropPress = () => {
    // Close dropdown when clicking backdrop
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  return (
    <View ref={containerRef} style={[styles.container, containerStyle]} testID="grocery-search-container">
      <View style={searchBarStyle}>
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
        <>
          {/* Backdrop to catch outside clicks - behind dropdown */}
          <Pressable
            style={styles.backdrop}
            onPress={handleBackdropPress}
          />
          <View 
            ref={dropdownRef} 
            style={[styles.searchDropdown, dropdownStyle]} 
            testID="grocery-search-dropdown"
          >
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
                  testID={`add-button-custom-${customItem.id}`}
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
                  testID={`add-button-${item.id}`}
                >
                  <Ionicons name="add-circle" size={28} color={colors.shopping} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}
