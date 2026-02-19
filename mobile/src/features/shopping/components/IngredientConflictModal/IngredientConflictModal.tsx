import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { colors, spacing, borderRadius } from '../../../../theme';
import type { Ingredient } from '../../../../mocks/recipes';
import type { ShoppingItem } from '../../../../mocks/shopping';
import { addQuantities } from '../../../recipes/utils/unitConversion';

interface IngredientConflictModalProps {
  visible: boolean;
  ingredient: Ingredient;
  existingItem: ShoppingItem;
  onClose: () => void;
  onReplace: () => void;
  onAddToQuantity: () => void;
}

export function IngredientConflictModal({
  visible,
  ingredient,
  existingItem,
  onClose,
  onReplace,
  onAddToQuantity,
}: IngredientConflictModalProps) {
  const { t } = useTranslation('shopping');

  const formatQuantity = (quantity: number, unit?: string) => {
    const qty = typeof quantity === 'number' ? quantity : parseFloat(String(quantity)) || 0;
    return unit ? `${qty} ${unit}` : String(qty);
  };

  const currentQuantity = formatQuantity(existingItem.quantity, existingItem.unit);
  const recipeQuantity = formatQuantity(
    ingredient.quantityAmount ?? ingredient.quantity ?? 0,
    ingredient.quantityUnit ?? ingredient.unit
  );

  const currentQtyNum = typeof existingItem.quantity === 'number' ? existingItem.quantity : parseFloat(String(existingItem.quantity)) || 0;
  const ingredientQtyNum = typeof ingredient.quantityAmount === 'number'
    ? ingredient.quantityAmount
    : parseFloat(String(ingredient.quantityAmount ?? ingredient.quantity)) || 0;

  const combinedAmount = addQuantities(
    currentQtyNum, existingItem.unit || '',
    ingredientQtyNum, ingredient.quantityUnit || ingredient.unit || '',
    existingItem.unit || ''
  );

  const finalAmount = combinedAmount !== null ? combinedAmount : (currentQtyNum + ingredientQtyNum);

  const combinedQuantity = formatQuantity(
    finalAmount,
    existingItem.unit || ingredient.quantityUnit || ingredient.unit
  );

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('ingredientConflictModal.title')}
      showActions={false}
    >
      <View style={styles.content}>
        <Text style={styles.message}>
          {t('ingredientConflictModal.message', { name: ingredient.name })}
        </Text>

        <View style={styles.comparisonRow}>
          <View style={styles.column}>
            <Text style={styles.label}>{t('ingredientConflictModal.currentLabel')}</Text>
            <Text style={styles.value}>{currentQuantity}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>{t('ingredientConflictModal.recipeNeedsLabel')}</Text>
            <Text style={styles.value}>{recipeQuantity}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.replaceButton}
            onPress={onReplace}
          >
            <Text style={styles.replaceButtonText}>
              {t('ingredientConflictModal.replaceButton', { quantity: recipeQuantity })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddToQuantity}
          >
            <Text style={styles.addButtonText}>
              {t('ingredientConflictModal.addButton', { quantity: combinedQuantity })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </CenteredModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  message: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: colors.quantityBg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  column: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.md,
  },
  replaceButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  replaceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.recipes,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
