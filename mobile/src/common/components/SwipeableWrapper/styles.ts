import { StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
  },
  leftBackground: {
    left: 0,
  },
  rightBackground: {
    right: 0,
  },
  card: {
    // Styling handled by child component (ListItemCardWrapper)
    // Only transform is applied via animated styles
  },
  deleteActionButton: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
