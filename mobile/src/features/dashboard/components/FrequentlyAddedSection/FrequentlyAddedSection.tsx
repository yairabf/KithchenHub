import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../../../../common/components/SafeImage';
import { TextBlock } from '../../../../common/components/TextBlock';
import { colors } from '../../../../theme';
import { styles } from './styles';
import type { FrequentlyAddedSectionProps } from './types';

export function FrequentlyAddedSection({
  isTablet,
  isRtl,
  items,
  onItemPress,
}: FrequentlyAddedSectionProps) {
  const { t } = useTranslation('dashboard');
  const hasItems = items.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TextBlock
          title={t('frequentlyAdded.title')}
          subtitle={t('frequentlyAdded.subtitle')}
          isRtl={isRtl}
          containerStyle={styles.titleBlock}
          containerRtlStyle={styles.titleBlockRtl}
          titleStyle={styles.title}
          titleRtlStyle={styles.titleRtl}
          subtitleStyle={styles.subtitle}
          subtitleRtlStyle={styles.subtitleRtl}
        />
      </View>

      {hasItems ? (
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemTile, isTablet ? styles.itemTileTablet : styles.itemTilePhone]}
              onPress={() => onItemPress(item)}
              activeOpacity={0.8}
              accessibilityLabel={t('frequentlyAdded.addItemAccessibility', { name: item.name })}
              accessibilityRole="button"
            >
              <View style={styles.itemImageContainer}>
                <SafeImage uri={item.image} style={styles.itemImage} />
              </View>
              <View style={[styles.itemFooter, isRtl && styles.itemFooterRtl]}>
                <Text style={[styles.itemName, isRtl && styles.itemNameRtl]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Ionicons name="add-circle" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, isRtl && styles.emptyTitleRtl]}>
            {t('frequentlyAdded.emptyTitle')}
          </Text>
          <Text style={[styles.emptySubtitle, isRtl && styles.emptySubtitleRtl]}>
            {t('frequentlyAdded.emptySubtitle')}
          </Text>
        </View>
      )}
    </View>
  );
}
