import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import type { CreateListModalProps, ListIconName } from './types';
import { styles } from './styles';

const LIST_ICON_CATEGORIES: ReadonlyArray<{
  icons: readonly ListIconName[];
}> = [
  { icons: ['home-outline', 'cart-outline'] },
  { icons: ['restaurant-outline', 'nutrition-outline'] },
  { icons: ['gift-outline', 'heart-outline'] },
  { icons: ['cube-outline', 'star-outline'] },
] as const;

const LIST_ICON_OPTIONS = LIST_ICON_CATEGORIES.flatMap((category) => category.icons);

const LIST_COLOR_CATEGORIES = [
  ['#10B981', '#14B8A6', '#06B6D4'],
  ['#F59E0B', '#F97316', '#EF4444'],
  ['#8B5CF6', '#EC4899'],
] as const;

const LIST_COLOR_OPTIONS = LIST_COLOR_CATEGORIES.flatMap((category) => category);

export function CreateListModal({
  visible,
  onClose,
  onConfirm,
  confirmDisabled,
  mode = 'create',
  listName,
  onChangeListName,
  selectedIcon,
  onSelectIcon,
  selectedColor,
  onSelectColor,
}: CreateListModalProps) {
  const { t, i18n } = useTranslation('shopping');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;
  const isEditMode = mode === 'edit';

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={isEditMode ? t('createListModal.titleEdit') : t('createListModal.titleCreate')}
      confirmText={isEditMode ? t('createListModal.confirmSave') : t('createListModal.confirmCreate')}
      onConfirm={onConfirm}
      confirmColor={colors.chores}
      confirmDisabled={confirmDisabled}
    >
      <View style={[styles.createListInputSection, isRtlLayout && styles.modalSectionRtl]}>
        <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
          <Text style={[styles.createListLabel, isRtlLayout && styles.modalTextRtl]}>{t('createListModal.listNameLabel')}</Text>
        </View>
        <TextInput
          style={[styles.createListInput, isRtlLayout && styles.createListInputRtl, isRtlLayout && styles.modalTextRtl]}
          placeholder={t('createListModal.listNamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={listName}
          onChangeText={onChangeListName}
          autoFocus
          accessibilityLabel={t('createListModal.listNameAccessibility')}
          accessibilityHint={t('createListModal.listNameHint')}
        />
      </View>

      <View style={[styles.createListIconSection, isRtlLayout && styles.modalSectionRtl]}>
        <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
          <Text style={[styles.createListLabel, isRtlLayout && styles.modalTextRtl]}>{t('createListModal.iconLabel')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.iconPickerContent, isRtlLayout && styles.pickerContentRtl]}
        >
          {LIST_ICON_OPTIONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconOption, selectedIcon === icon && styles.iconOptionActive]}
              onPress={() => onSelectIcon(icon)}
              accessibilityLabel={t('createListModal.iconSelectAccessibility', { icon })}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedIcon === icon }}
            >
              <Ionicons
                name={icon}
                size={24}
                color={selectedIcon === icon ? colors.chores : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.createListColorSection, isRtlLayout && styles.modalSectionRtl]}>
        <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
          <Text style={[styles.createListLabel, isRtlLayout && styles.modalTextRtl]}>{t('createListModal.colorLabel')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.colorPickerContent, isRtlLayout && styles.pickerContentRtl]}
        >
          {LIST_COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionActive,
              ]}
              onPress={() => onSelectColor(color)}
              accessibilityLabel={t('createListModal.colorSelectAccessibility', { color })}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedColor === color }}
            >
              {selectedColor === color && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </CenteredModal>
  );
}
