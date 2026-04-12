import { StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    // marginBottom removed - layout should be handled by parent list/container
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    // Width is applied inline using the actionWidth prop so it always matches
    // the maximum swipe distance and never overflows the card bounds.
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
});
