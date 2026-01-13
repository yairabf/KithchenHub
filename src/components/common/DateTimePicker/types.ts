export interface DateTimePickerProps {
  /** Current selected date/time value */
  value: Date | null;

  /** Callback when date/time is confirmed */
  onChange: (date: Date) => void;

  /** Label shown above the trigger button */
  label?: string;

  /** Placeholder text when no date is selected */
  placeholder?: string;

  /** Minimum selectable date */
  minDate?: Date;

  /** Maximum selectable date */
  maxDate?: Date;

  /** Accent color for selected states (defaults to colors.primary) */
  accentColor?: string;

  /** Disable the picker */
  disabled?: boolean;

  /** Date format string for display (dayjs format) */
  displayFormat?: string;

  /** Time format: 12-hour or 24-hour */
  timeFormat?: '12h' | '24h';

  /** Minute interval for time selection (default: 1) */
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
}

export interface DateTimePickerButtonProps {
  label?: string;
  value: string | null;
  placeholder: string;
  accentColor: string;
  disabled: boolean;
  onPress: () => void;
}

export interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  value: Date | null;
  minDate?: Date;
  maxDate?: Date;
  accentColor: string;
  timeFormat: '12h' | '24h';
  minuteInterval: 1 | 5 | 10 | 15 | 30;
}

export interface TimePickerWebProps {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  minuteInterval: 1 | 5 | 10 | 15 | 30;
  accentColor: string;
  timeFormat: '12h' | '24h';
}

export type ActiveTab = 'date' | 'time';
