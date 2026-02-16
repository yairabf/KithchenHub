import { StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../../theme';

export const styles = StyleSheet.create({
    wrapper: {
        padding: spacing.sm + spacing.xs, // Reduced from md + xs (20px) to sm + xs (12px)
        borderRadius: borderRadius.xxl,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.lg,
    },
});
