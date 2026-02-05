import { StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../../theme';

export const styles = StyleSheet.create({
    wrapper: {
        padding: spacing.md + spacing.xs,
        borderRadius: borderRadius.xxl,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.lg,
    },
});
