export interface ChoresProgressCardProps {
  /** Progress value 0-100 */
  progress: number;
  completedCount: number;
  totalCount: number;
  /** When true, uses horizontal layout (tablet/wide); when false, vertical (phone) */
  isWideScreen: boolean;
  /** Apply explicit RTL text alignment on web */
  isWebRtl?: boolean;

  /** Explicit RTL layout override */
  isRtl?: boolean;
}
