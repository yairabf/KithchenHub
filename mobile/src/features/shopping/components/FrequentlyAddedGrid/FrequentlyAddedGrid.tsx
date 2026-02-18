import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { FrequentlyAddedGridProps } from './types';
import { FrequentlyAddedGridItem } from './FrequentlyAddedGridItem';

const MAX_DISPLAY_ITEMS = 8;

export function FrequentlyAddedGrid({
  items,
  onItemPress,
}: FrequentlyAddedGridProps) {
  const { t } = useTranslation('shopping');
  const displayItems = items.slice(0, MAX_DISPLAY_ITEMS);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('frequentlyAdded.title')}</Text>
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
