import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { CategoryPicker } from '../CategoryPicker';
import { getCategoryImageSource, isValidItemImage } from '../../utils/categoryImage';
import type { CreateCustomItemModalProps } from './types';
import { styles } from './styles';

export function CreateCustomItemModal({
  visible,
  onClose,
  onConfirm,
  listName,
  confirmColor,
  selectedGroceryItem,
  selectedItemCategory,
  onSelectCategory,
  availableCategories,
  quantityInput,
  onChangeQuantity,
  onDecreaseQuantity,
  onIncreaseQuantity,
}: CreateCustomItemModalProps) {
  const { t } = useTranslation('shopping');
  const [didRemoteImageFail, setDidRemoteImageFail] = useState(false);

  useEffect(() => {
    setDidRemoteImageFail(false);
  }, [selectedGroceryItem?.id, selectedGroceryItem?.image, selectedItemCategory]);

  const isCustomItem = Boolean(selectedGroceryItem?.id.startsWith('custom-'));
  const effectiveCategory = isCustomItem
    ? selectedItemCategory
    : selectedGroceryItem?.category ?? '';
  const fallbackCategorySource = getCategoryImageSource(effectiveCategory);
  const remoteImageSource = selectedGroceryItem
    ? isValidItemImage(selectedGroceryItem.image)
      ? { uri: selectedGroceryItem.image }
      : null
    : null;
  const itemImageSource = didRemoteImageFail
    ? fallbackCategorySource
    : remoteImageSource ?? fallbackCategorySource;

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('createCustomItemModal.title', { listName })}
      confirmText={t('createCustomItemModal.confirm')}
      onConfirm={onConfirm}
      confirmColor={confirmColor}
    >
      {selectedGroceryItem && (
        <>
          <View style={styles.modalItemDisplay}>
            {itemImageSource ? (
              <Image
                source={itemImageSource}
                style={styles.modalItemImage}
                onError={() => setDidRemoteImageFail(true)}
              />
            ) : (
              <View style={styles.modalItemImage} />
            )}
            <View style={styles.modalItemInfo}>
              <Text style={styles.modalItemName}>{selectedGroceryItem.name}</Text>
              <Text style={styles.modalItemCategory}>{selectedGroceryItem.category}</Text>
            </View>
          </View>

          {selectedGroceryItem.id.startsWith('custom-') && availableCategories.length > 0 && (
            <View style={styles.modalCategorySection}>
              <Text style={styles.modalQuantityLabel}>{t('createCustomItemModal.categoryLabel')}</Text>
              <CategoryPicker
                selectedCategory={selectedItemCategory}
                onSelectCategory={onSelectCategory}
                categories={availableCategories}
              />
            </View>
          )}

          <View style={styles.modalQuantitySection}>
            <Text style={styles.modalQuantityLabel}>{t('createCustomItemModal.quantityLabel')}</Text>
            <View style={styles.modalQuantityControls}>
              <TouchableOpacity
                style={styles.modalQuantityBtn}
                onPress={onDecreaseQuantity}
                accessibilityLabel={t('createCustomItemModal.decreaseQuantityAccessibility')}
                accessibilityRole="button"
                accessibilityHint={t('createCustomItemModal.decreaseQuantityHint')}
              >
                <Ionicons name="remove" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <TextInput
                style={styles.modalQuantityInput}
                value={quantityInput}
                onChangeText={onChangeQuantity}
                keyboardType="number-pad"
                selectTextOnFocus
                accessibilityLabel={t('createCustomItemModal.quantityInputAccessibility')}
                accessibilityHint={t('createCustomItemModal.quantityInputHint')}
              />
              <TouchableOpacity
                style={styles.modalQuantityBtn}
                onPress={onIncreaseQuantity}
                accessibilityLabel={t('createCustomItemModal.increaseQuantityAccessibility')}
                accessibilityRole="button"
                accessibilityHint={t('createCustomItemModal.increaseQuantityHint')}
              >
                <Ionicons name="add" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </CenteredModal>
  );
}
