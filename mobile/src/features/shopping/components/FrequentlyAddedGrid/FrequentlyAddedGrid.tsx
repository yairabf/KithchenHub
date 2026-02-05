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
import { FrequentlyAddedGridItem } from './FrequentlyAddedGridItem';

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
          <FrequentlyAddedGridItem
            key={item.id}
            item={item}
            onAdd={() => onItemPress(item)}
          />
        ))}
      </View>
    </View>
  );
}
