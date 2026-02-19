import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, I18nManager } from 'react-native';
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
  customItemName,
  onSelectCategory,
  onChangeCustomItemName,
  availableCategories,
  quantityInput,
  onChangeQuantity,
  onDecreaseQuantity,
  onIncreaseQuantity,
}: CreateCustomItemModalProps) {
  const { t, i18n } = useTranslation('shopping');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;
  const [didRemoteImageFail, setDidRemoteImageFail] = useState(false);

  useEffect(() => {
    setDidRemoteImageFail(false);
  }, [selectedGroceryItem?.id, selectedGroceryItem?.image, selectedItemCategory]);

  const isCustomItem = Boolean(selectedGroceryItem?.id.startsWith('custom-'));
  const effectiveCategory = isCustomItem
    ? selectedItemCategory
    : selectedGroceryItem?.category ?? '';
  const fallbackCategorySource = getCategoryImageSource(effectiveCategory);
  const displayItemName = isCustomItem ? customItemName : selectedGroceryItem?.name ?? '';
  const remoteImageSource = selectedGroceryItem
    ? isValidItemImage(selectedGroceryItem.image)
      ? { uri: selectedGroceryItem.image }
      : null
    : null;
  const itemImageSource = didRemoteImageFail
    ? fallbackCategorySource
    : remoteImageSource ?? fallbackCategorySource;
  const isConfirmDisabled = isCustomItem && !customItemName.trim();

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('createCustomItemModal.title', { listName })}
      confirmText={t('createCustomItemModal.confirm')}
      onConfirm={onConfirm}
      confirmColor={confirmColor}
      confirmDisabled={isConfirmDisabled}
    >
      {selectedGroceryItem && (
        <>
          <View style={[styles.modalItemDisplay, isRtlLayout && styles.modalItemDisplayRtl]}>
            {itemImageSource ? (
              <Image
                source={itemImageSource}
                style={styles.modalItemImage}
                onError={() => setDidRemoteImageFail(true)}
              />
            ) : (
              <View style={styles.modalItemImage} />
            )}
            <View style={[styles.modalItemInfo, isRtlLayout && styles.modalItemInfoRtl]}>
              <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
                {isCustomItem ? (
                  <TextInput
                    style={[
                      styles.modalItemNameInput,
                      isRtlLayout && styles.modalTextRtl,
                      isRtlLayout && styles.modalItemNameInputRtl,
                    ]}
                    value={customItemName}
                    onChangeText={onChangeCustomItemName}
                    placeholder={t('createCustomItemModal.customNamePlaceholder', { defaultValue: 'Item name' })}
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={t('createCustomItemModal.customNameAccessibility', { defaultValue: 'Custom item name' })}
                    accessibilityHint={t('createCustomItemModal.customNameHint', { defaultValue: 'Edit the custom item name before adding' })}
                  />
                ) : (
                  <Text style={[styles.modalItemName, isRtlLayout && styles.modalTextRtl]}>{displayItemName}</Text>
                )}
              </View>
              <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
                <Text style={[styles.modalItemCategory, isRtlLayout && styles.modalTextRtl]}>{selectedGroceryItem.category}</Text>
              </View>
            </View>
          </View>

          {selectedGroceryItem.id.startsWith('custom-') && availableCategories.length > 0 && (
            <View style={[styles.modalCategorySection, isRtlLayout && styles.modalSectionRtl]}>
              <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
                <Text style={[styles.modalQuantityLabel, isRtlLayout && styles.modalTextRtl]}>{t('createCustomItemModal.categoryLabel')}</Text>
              </View>
              <CategoryPicker
                selectedCategory={selectedItemCategory}
                onSelectCategory={onSelectCategory}
                categories={availableCategories}
                isRtl={isRtlLayout}
              />
            </View>
          )}

          <View style={[styles.modalQuantitySection, isRtlLayout && styles.modalSectionRtl]}>
            <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
              <Text style={[styles.modalQuantityLabel, isRtlLayout && styles.modalTextRtl]}>{t('createCustomItemModal.quantityLabel')}</Text>
            </View>
            <View style={[styles.modalQuantityControls, isRtlLayout && styles.modalQuantityControlsRtl]}>
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
                style={[styles.modalQuantityInput, isRtlLayout && styles.modalQuantityInputRtl]}
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
