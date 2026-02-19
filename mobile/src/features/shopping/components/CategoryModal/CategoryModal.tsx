import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Animated,
  AccessibilityInfo,
  findNodeHandle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { CategoryModalProps } from './types';

export function CategoryModal({
  visible,
  categoryName,
  items,
  isLoading = false,
  errorMessage = null,
  onClose,
  onSelectItem,
}: CategoryModalProps) {
  const titleRef = useRef<Text>(null);
  const { t } = useTranslation('shopping');
  const localizedCategoryName = t(`categories:${categoryName}`, { defaultValue: categoryName });

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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
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
                {localizedCategoryName}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isLoading ? t('categoryModal.loadingItems') : t('itemCount', { count: items.length })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('categoryModal.close')}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={colors.shopping} />
                <Text style={styles.emptyText}>{t('categoryModal.loadingItems')}</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.emptyText}>{errorMessage}</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('categoryModal.noItems')}</Text>
              </View>
            ) : (
              items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => onSelectItem(item)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{t(`categories:${item.category}`, { defaultValue: item.category })}</Text>
                  </View>
                  <View style={styles.addButton}>
                    <Ionicons name="add-circle" size={32} color={colors.shopping} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
