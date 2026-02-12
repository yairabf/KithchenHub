import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
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
import { colors } from '../../../../theme';
import { styles } from './styles';
import { CategoryModalProps } from './types';

export function CategoryModal({
  visible,
  categoryName,
  items,
  onClose,
  onSelectItem,
}: CategoryModalProps) {
  const titleRef = useRef<Text>(null);

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
                {categoryName}
              </Text>
              <Text style={styles.headerSubtitle}>{items.length} items</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close category modal"
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
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No items in this category</Text>
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
                    <Text style={styles.itemCategory}>{item.category}</Text>
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
