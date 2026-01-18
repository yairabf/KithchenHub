import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { FrequentlyAddedGridProps } from './types';

const MAX_DISPLAY_ITEMS = 8;

export function FrequentlyAddedGrid({
  items,
  onItemPress,
}: FrequentlyAddedGridProps) {
  const displayItems = items.slice(0, MAX_DISPLAY_ITEMS);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Frequently Added</Text>
      </View>
      <View style={styles.grid}>
        {displayItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemTile}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
            accessibilityLabel={`Add ${item.name} to list`}
            accessibilityRole="button"
          >
            <View style={styles.itemImageContainer}>
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
              />
            </View>
            <View style={styles.itemNameContainer}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name="add-circle" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
