import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const isEditMode = mode === 'edit';

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={isEditMode ? 'Edit List' : 'Create New List'}
      confirmText={isEditMode ? 'Save' : 'Create'}
      onConfirm={onConfirm}
      confirmColor={colors.chores}
      confirmDisabled={confirmDisabled}
    >
      <View style={styles.createListInputSection}>
        <Text style={styles.createListLabel}>List Name</Text>
        <TextInput
          style={styles.createListInput}
          placeholder="Enter list name..."
          placeholderTextColor={colors.textMuted}
          value={listName}
          onChangeText={onChangeListName}
          autoFocus
          accessibilityLabel="List name"
          accessibilityHint="Enter a name for the new shopping list"
        />
      </View>

      <View style={styles.createListIconSection}>
        <Text style={styles.createListLabel}>Icon</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.iconPickerContent}
        >
          {LIST_ICON_OPTIONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconOption, selectedIcon === icon && styles.iconOptionActive]}
              onPress={() => onSelectIcon(icon)}
              accessibilityLabel={`Select ${icon} icon`}
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

      <View style={styles.createListColorSection}>
        <Text style={styles.createListLabel}>Color</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorPickerContent}
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
              accessibilityLabel={`Select color ${color}`}
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
