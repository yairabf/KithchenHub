import { StyleSheet } from 'react-native';
import { colors, withOpacity } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

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
    flexDirection: 'row',
    gap: spacing.xl,
  },
  sidebar: {
    flex: 35,
    flexShrink: 0,
  },
  mainContent: {
    flex: 65,
    gap: spacing.xl,
  },
  // Phone-specific styles (applied dynamically via useResponsive hook)
  contentRowPhone: {
    flexDirection: 'column',
  },
  sidebarPhone: {
    flex: undefined,
    width: '100%',
  },
  mainContentPhone: {
    flex: 1,
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
  instructionsList: {
    gap: spacing.md,
  },
});
