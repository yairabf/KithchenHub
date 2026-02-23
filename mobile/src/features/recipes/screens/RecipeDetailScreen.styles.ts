import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';
import { SCROLL_CONTENT_BOTTOM_PADDING } from './RecipeDetailScreen.constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerRtl: {
    direction: 'rtl',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewRtl: {
    direction: 'rtl',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: SCROLL_CONTENT_BOTTOM_PADDING,
  },
  scrollContentRtl: {
    direction: 'rtl',
  },
  headerSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  dualScrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    flex: 1,
  },
  headerSectionFixed: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  sidebar: {
    flex: 35,
    flexShrink: 0,
  },
  sidebarScroll: {
    flex: 35,
    flexShrink: 0,
    height: 500,
  },
  sidebarScrollContent: {
    paddingBottom: spacing.xl,
  },
  mainContent: {
    flex: 65,
    gap: spacing.xl,
  },
  stepsScroll: {
    flex: 65,
    height: 500,
  },
  stepsScrollContent: {
    paddingBottom: spacing.xl,
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
  // Phone tabs layout
  phoneContent: {
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.recipes,
    fontWeight: '700',
  },
  tabContent: {
    width: '100%',
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
  stickyHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
    width: '100%',
  },
  stickyHeaderSpacer: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingContainerRtl: {
    alignItems: 'flex-end',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  loadingTextRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
});
