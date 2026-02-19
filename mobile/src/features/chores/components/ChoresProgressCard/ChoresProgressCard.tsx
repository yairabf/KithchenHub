import React from 'react';
import { View, Text, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressRing } from '../ProgressRing';
import { styles } from './styles';
import type { ChoresProgressCardProps } from './types';

/**
 * Chores Progress Card Component
 * 
 * Displays daily chore progress with a progress ring, percentage, and motivational text.
 * Adapts layout for wide (tablet) vs narrow (phone) screens.
 * 
 * @param props - Component props
 * @param props.progress - Progress value from 0 to 100
 * @param props.completedCount - Number of completed chores
 * @param props.totalCount - Total number of chores
 * @param props.isWideScreen - Whether to use horizontal (tablet) or vertical (phone) layout
 * 
 * @example
 * ```tsx
 * <ChoresProgressCard
 *   progress={75}
 *   completedCount={3}
 *   totalCount={4}
 *   isWideScreen={width >= 768}
 * />
 * ```
 */
export function ChoresProgressCard({
  progress,
  completedCount,
  totalCount,
  isWideScreen,
  isWebRtl = false,
  isRtl,
}: ChoresProgressCardProps) {
  const { t, i18n } = useTranslation('chores');
  const isDocumentRtl =
    typeof document !== 'undefined' && document?.documentElement?.dir === 'rtl';

  // Validate and normalize inputs to handle edge cases
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const safeCompleted = Math.max(0, completedCount ?? 0);
  const safeTotal = Math.max(0, totalCount ?? 0);
  const isRtlLayout = Boolean(
    isRtl ||
      isWebRtl ||
      (typeof i18n?.dir === 'function' && i18n.dir() === 'rtl') ||
      I18nManager.isRTL ||
      isDocumentRtl
  );
  const ProgressTextWrapper = isRtlLayout
    ? ({ children }: { children: React.ReactNode }) => <View style={styles.progressTextRowRtl}>{children}</View>
    : React.Fragment;

  const ringSize = isWideScreen ? 160 : 140;
  const bodyText = isWideScreen
    ? t('progress.bodyWide', { completed: safeCompleted, total: safeTotal })
    : t('progress.bodyCompact', { completed: safeCompleted, total: safeTotal });

  return (
    <View style={styles.progressCard}>
      <View
        style={[
          styles.progressRow,
          !isWideScreen && styles.progressRowPhone,
        ]}
      >
        <View style={styles.progressRingWrap}>
          <ProgressRing
            progress={safeProgress}
            size={ringSize}
            showPercentage={false}
            showEmoji={false}
          />
          <View style={styles.progressRingText}>
            <Text style={styles.progressPercent}>{Math.round(safeProgress)}%</Text>
            <Text style={[styles.progressLabel, isRtlLayout && styles.progressTextRtl]}>{t('progress.today')}</Text>
          </View>
        </View>
        <View
          style={[
            styles.progressDetails,
            !isWideScreen && styles.progressDetailsPhone,
          ]}
        >
          <ProgressTextWrapper>
            <Text style={[styles.progressTitle, isRtlLayout && styles.progressTextRtl]}>{t('progress.title')}</Text>
          </ProgressTextWrapper>
          <ProgressTextWrapper>
            <Text
              style={[
                styles.progressBody,
                !isWideScreen && !isRtlLayout && styles.progressBodyPhone,
                isRtlLayout && styles.progressTextRtl,
                isRtlLayout && styles.progressBodyRtl,
              ]}
              numberOfLines={isWideScreen ? undefined : 3}
            >
              {bodyText}
            </Text>
          </ProgressTextWrapper>
        </View>
      </View>
    </View>
  );
}
