/**
 * Offline Pill Component Types
 */

export type OfflinePillPosition = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';

export interface OfflinePillProps {
  /**
   * Position of the pill on screen
   * @default 'bottom-right'
   */
  position?: OfflinePillPosition;
  
  /**
   * Whether the pill can be dismissed by the user
   * @default false
   */
  dismissible?: boolean;
  
  /**
   * Whether to show pending count in the pill
   * @default true
   */
  showPendingCount?: boolean;
}
