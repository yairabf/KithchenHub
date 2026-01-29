import dayjs from 'dayjs';

/**
 * Formats a date for display as time in 12-hour format (e.g. "3:45 PM").
 *
 * @param date - The date to format
 * @returns Time string in "h:mm A" format
 */
export function formatTimeForDisplay(date: Date): string {
  return dayjs(date).format('h:mm A');
}

/**
 * Formats a date for display as full day and date (e.g. "Wednesday, January 29").
 *
 * @param date - The date to format
 * @returns Date string in "dddd, MMMM D" format
 */
export function formatDateForDisplay(date: Date): string {
  return dayjs(date).format('dddd, MMMM D');
}
