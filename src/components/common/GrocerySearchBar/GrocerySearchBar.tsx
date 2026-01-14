import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { styles } from './styles';
import { GrocerySearchBarProps, GroceryItem } from './types';

export function GrocerySearchBar({
  items,
  onSelectItem,
  onQuickAddItem,
  placeholder = 'Search groceries to add...',
  variant = 'surface',
  showShadow = true,
  maxResults = 8,
  value,
  onChangeText,
  containerStyle,
  dropdownStyle,
}: GrocerySearchBarProps) {
  // Internal state for uncontrolled mode
  const [internalQuery, setInternalQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Use controlled value if provided, otherwise use internal state
  const searchQuery = value !== undefined ? value : internalQuery;
  const handleQueryChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setInternalQuery(text);
    }
  };

  // Search logic with filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return items
      .filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
      .slice(0, maxResults);
  }, [searchQuery, items, maxResults]);

  // Show/hide dropdown based on search results
  useEffect(() => {
    setShowDropdown(searchQuery.trim().length > 0 && searchResults.length > 0);
  }, [searchQuery, searchResults]);

  const handleSelectItem = (item: GroceryItem) => {
    onSelectItem(item);
    // Keep dropdown open so user can continue adding items
  };

  const handleQuickAdd = (item: GroceryItem) => {
    onQuickAddItem(item);
    // Keep dropdown open for rapid multi-item addition
  };

  const handleClear = () => {
    handleQueryChange('');
    setShowDropdown(false);
  };

  const handleOutsidePress = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  // Determine search bar style based on variant
  const searchBarStyle = [
    styles.searchBar,
    variant === 'surface' ? styles.searchBarSurface : styles.searchBarBackground,
    showShadow && styles.searchBarShadow,
  ];

  return (
    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
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
                  >
                    <Ionicons name="add-circle" size={28} color={colors.shopping} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
