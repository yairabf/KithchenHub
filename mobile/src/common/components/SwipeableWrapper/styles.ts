import { StyleSheet, Dimensions } from 'react-native';
import { colors, borderRadius, shadows } from '../../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const DELETE_THRESHOLD = SCREEN_WIDTH * 0.3; // 30% of screen width

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    width: SCREEN_WIDTH * 0.35, // Slightly wider than threshold
  },
  leftBackground: {
    left: 0,
  },
  rightBackground: {
    right: 0,
  },
  card: {
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
});
