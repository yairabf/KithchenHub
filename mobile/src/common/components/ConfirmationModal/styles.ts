import { StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { typography } from '../../../theme/typography';

export const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.md,
  },
  message: {
    ...typography.body,
    lineHeight: 24,
  },
});
