import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { colors, spacing, borderRadius } from '../../../../theme';
import type { Ingredient } from '../../../../mocks/recipes';
import type { ShoppingItem } from '../../../../mocks/shopping';

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
  const formatQuantity = (quantity: number, unit?: string) => {
    const qty = typeof quantity === 'number' ? quantity : parseFloat(String(quantity)) || 0;
    return unit ? `${qty} ${unit}` : String(qty);
  };

  const currentQuantity = formatQuantity(existingItem.quantity, existingItem.unit);
  const recipeQuantity = formatQuantity(ingredient.quantity, ingredient.unit);
  const combinedQuantity = formatQuantity(
    (typeof existingItem.quantity === 'number' ? existingItem.quantity : parseFloat(String(existingItem.quantity)) || 0) +
    (typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(String(ingredient.quantity)) || 0),
    existingItem.unit || ingredient.unit
  );

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="Item Already in List"
      showActions={false}
    >
      <View style={styles.content}>
        <Text style={styles.message}>
          "{ingredient.name}" is already in your shopping list.
        </Text>
        
        <View style={styles.comparisonRow}>
          <View style={styles.column}>
            <Text style={styles.label}>Current:</Text>
            <Text style={styles.value}>{currentQuantity}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Recipe needs:</Text>
            <Text style={styles.value}>{recipeQuantity}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.replaceButton}
            onPress={onReplace}
          >
            <Text style={styles.replaceButtonText}>
              Replace with {recipeQuantity}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddToQuantity}
          >
            <Text style={styles.addButtonText}>
              Add to quantity ({combinedQuantity})
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
    backgroundColor: colors.surfaceVariant,
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
