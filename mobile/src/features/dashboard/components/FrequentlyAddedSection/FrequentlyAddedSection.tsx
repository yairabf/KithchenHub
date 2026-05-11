import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../../../../common/components/SafeImage';
import { TextBlock } from '../../../../common/components/TextBlock';
import { colors } from '../../../../theme';
import { getCategoryImageSource } from '../../../shopping/utils/categoryImage';
import { styles } from './styles';
import type { FrequentlyAddedSectionProps } from './types';
import type { GroceryItem } from '../../../shopping/components/GrocerySearchBar';

type FrequentItemTileProps = {
  isRtl: boolean;
  isTablet: boolean;
  item: GroceryItem;
  onItemPress: (item: GroceryItem) => void;
  accessibilityLabel: string;
};

function FrequentItemTile({
  accessibilityLabel,
  isRtl,
  isTablet,
  item,
  onItemPress,
}: FrequentItemTileProps) {
  const feedbackAnimation = useRef(new Animated.Value(0)).current;

  const runPressFeedback = useCallback(() => {
    feedbackAnimation.stopAnimation();
    feedbackAnimation.setValue(0);

    Animated.sequence([
      Animated.timing(feedbackAnimation, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(feedbackAnimation, {
        toValue: 0,
        duration: 190,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [feedbackAnimation]);

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    runPressFeedback();
    onItemPress(item);
  }, [item, onItemPress, runPressFeedback]);

  const tileScale = feedbackAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

  const fallbackCategoryImage = getCategoryImageSource(item.category);

  const feedbackOverlayOpacity = feedbackAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  return (
    <Animated.View
      testID={`frequent-item-tile-${item.id}`}
      style={[
        styles.itemTile,
        isTablet ? styles.itemTileTablet : styles.itemTilePhone,
        { transform: [{ scale: tileScale }] },
      ]}
    >
      <Pressable
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={styles.itemPressable}
      >
        <View style={styles.quickAddBadge} testID={`frequent-item-add-icon-${item.id}`}>
          <Ionicons name="add" size={16} color={colors.primary} />
        </View>
        <View style={styles.itemImageContainer}>
          <View style={styles.itemImageBadge}>
            <SafeImage
              uri={item.image}
              testID={`frequent-item-image-${item.id}`}
              style={styles.itemImage}
              fallbackIcon={
                fallbackCategoryImage ? (
                  <Image
                    source={fallbackCategoryImage}
                    style={styles.itemImage}
                    resizeMode="contain"
                    testID={`frequent-item-category-image-${item.id}`}
                  />
                ) : undefined
              }
            />
          </View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.itemFeedbackOverlay,
              { opacity: feedbackOverlayOpacity },
            ]}
          />
        </View>
        <View style={styles.itemFooter}>
          <Text
            testID={`frequent-item-name-${item.id}`}
            style={[styles.itemName, isRtl && styles.itemNameRtl]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

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
            <FrequentItemTile
              key={item.id}
              item={item}
              isTablet={isTablet}
              isRtl={isRtl}
              onItemPress={onItemPress}
              accessibilityLabel={t('frequentlyAdded.addItemAccessibility', { name: item.name })}
            />
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
