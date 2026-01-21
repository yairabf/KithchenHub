import { StyleSheet } from 'react-native';
import { shadows } from '../../../theme';

export const DEFAULT_FAB_SIZE = 52;

export const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
});
