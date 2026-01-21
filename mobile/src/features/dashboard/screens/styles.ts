import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, componentSize } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: componentSize.button.md,
    height: componentSize.button.md,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logoText: {
    ...typography.h3,
    marginLeft: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.widgetBackground,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xxs,
    marginHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.bodySmall,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'flex-end',
  },
  profileRole: {
    ...typography.tiny,
    marginBottom: spacing.xxs,
  },
  profileName: {
    ...typography.labelBold,
  },
  avatarContainer: {
    width: componentSize.avatar.md,
    height: componentSize.avatar.md,
    borderRadius: componentSize.avatar.md / 2,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    backgroundColor: colors.avatarBackground,
    ...shadows.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greeting: {
    ...typography.display,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1.2,
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  editButton: {
    ...typography.labelBold,
    color: colors.primary,
  },
  overviewCards: {
    gap: spacing.md,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxxl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg - spacing.xs,
    ...shadows.lg,
  },
  overviewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  overviewIconContainer: {
    width: componentSize.icon.container.md,
    height: componentSize.icon.container.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewTextContainer: {
    gap: spacing.xs,
  },
  overviewTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  overviewSub: {
    ...typography.sectionTitleMuted,
  },
  addWidgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: borderRadius.pill,
  },
  addWidgetText: {
    ...typography.labelBold,
    color: colors.textMuted,
  },
  widgetCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 217,
    maxHeight: 217,
    minHeight: 217,
    ...shadows.lg,
  },
  widgetIconContainer: {
    width: componentSize.icon.container.md,
    height: componentSize.icon.container.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetLabel: {
    ...typography.widgetTitle,
    textAlign: 'center',
    minHeight: 84, // Fixed height for 3 lines of text (numberOfLines applied as prop)
  },
  // Phone-specific styles
  headerPhone: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBarPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.widgetBackground,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xxs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  mainGridPhone: {
    flexDirection: 'column',
    gap: spacing.lg,
  },
  fullWidthColumn: {
    flex: undefined,
    width: '100%',
  },
  widgetsColumnPhone: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  widgetCardPhone: {
    flex: undefined,
    width: '100%',
    aspectRatio: undefined,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: undefined,
    maxHeight: undefined,
    minHeight: undefined,
    gap: spacing.md,
  },
  widgetLabelPhone: {
    minHeight: undefined,
    textAlign: 'left',
  },
});
