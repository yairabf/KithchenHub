import { StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/spacing';
import { shadows } from '../../../../theme/shadows';

export const styles = StyleSheet.create({
  card: {
    padding: spacing.md + spacing.xs,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  content: {
    flex: 1,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.recipes,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.textPrimary,
  },
});
