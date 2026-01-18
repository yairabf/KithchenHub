import { StyleSheet, Dimensions } from 'react-native';
import { colors, withOpacity } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(colors.border, 0.5),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.textMuted,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  contentRow: {
    flexDirection: IS_TABLET ? 'row' : 'column',
    gap: spacing.xl,
  },
  sidebar: {
    width: IS_TABLET ? 300 : '100%',
    flexShrink: 0,
  },
  mainContent: {
    flex: 1,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
    backgroundColor: withOpacity(colors.recipes, 0.1),
    borderRadius: borderRadius.full,
  },
  addAllButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.recipes,
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  ingredientCardWrapper: {
    width: IS_TABLET ? (SCREEN_WIDTH - 300 - spacing.lg * 3 - spacing.md) / 2 : '100%',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsList: {
    gap: spacing.md,
  },
});

export { IS_TABLET, SCREEN_WIDTH };
