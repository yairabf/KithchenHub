/**
 * Audit action types for compliance and security logging.
 * Used when persisting critical events to the audit_logs table.
 */
export const AUDIT_ACTIONS = {
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  DELETE_HOUSEHOLD: 'DELETE_HOUSEHOLD',
  RESTORE_RECIPE: 'RESTORE_RECIPE',
  RESTORE_LIST: 'RESTORE_LIST',
  RESTORE_CHORE: 'RESTORE_CHORE',
  EXPORT_DATA: 'EXPORT_DATA',
  ADMIN_PROMOTE: 'ADMIN_PROMOTE',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
