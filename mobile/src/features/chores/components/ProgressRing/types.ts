export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showEmoji?: boolean;
}
