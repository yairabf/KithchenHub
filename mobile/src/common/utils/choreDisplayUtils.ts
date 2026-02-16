/**
 * Utility functions for displaying chore information
 */

/**
 * Formats chore due date and time with a consistent separator
 * @param dueDate - The due date string (e.g., "Feb 16, 2026")
 * @param dueTime - Optional due time string (e.g., "6:00 PM")
 * @returns Formatted date/time string with middle dot separator
 * 
 * @example
 * formatChoreDueDateTime("Feb 16", "6:00 PM") // "Feb 16 · 6:00 PM"
 * formatChoreDueDateTime("Feb 16", undefined) // "Feb 16"
 */
export function formatChoreDueDateTime(dueDate: string, dueTime?: string): string {
  return dueTime ? `${dueDate} · ${dueTime}` : dueDate;
}
