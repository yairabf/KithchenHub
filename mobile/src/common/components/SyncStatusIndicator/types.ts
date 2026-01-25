/**
 * Sync Status Indicator Component Types
 */

export type SyncStatus = 'pending' | 'confirmed' | 'failed';

export type IndicatorSize = 'small' | 'medium';

export interface SyncStatusIndicatorProps {
  /**
   * Sync status to display
   */
  status: SyncStatus;
  
  /**
   * Size of the indicator
   * @default 'small'
   */
  size?: IndicatorSize;
  
  /**
   * Whether to show text label
   * @default false
   */
  showLabel?: boolean;
}
