import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';
import { AUDIT_ACTIONS } from '../constants/audit-actions';
import { ENTITY_TYPES } from '../constants/entity-types';
import { AuditLog } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private auditRepository: AuditRepository) {}

  /**
   * Logs account deletion to the audit log (called before user record is deleted).
   */
  async logAccountDeletion(
    userId: string,
    metadata: {
      householdId?: string;
      role?: string;
      memberCount?: number;
      reason?: string;
    },
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      householdId: metadata.householdId,
      action: AUDIT_ACTIONS.DELETE_ACCOUNT,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      metadata: metadata as Record<string, unknown>,
    });
    this.logger.log('Audit: account deletion', { userId, ...metadata });
  }

  /**
   * Logs household deletion to the audit log.
   */
  async logHouseholdDeletion(
    householdId: string,
    metadata: { userId?: string; reason?: string },
  ): Promise<void> {
    await this.auditRepository.create({
      userId: metadata.userId,
      householdId,
      action: AUDIT_ACTIONS.DELETE_HOUSEHOLD,
      entityType: ENTITY_TYPES.HOUSEHOLD,
      entityId: householdId,
      metadata: metadata as Record<string, unknown>,
    });
    this.logger.log('Audit: household deletion', { householdId, ...metadata });
  }

  /**
   * Logs data export request for the user.
   */
  async logDataExport(userId: string): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: AUDIT_ACTIONS.EXPORT_DATA,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      metadata: { exportedAt: new Date().toISOString() },
    });
    this.logger.log('Audit: data export', { userId });
  }

  /**
   * Logs admin role promotion when an admin leaves a household.
   */
  async logAdminPromotion(
    userId: string,
    householdId: string,
    metadata: { promotedUserId: string },
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      householdId,
      action: AUDIT_ACTIONS.ADMIN_PROMOTE,
      entityType: ENTITY_TYPES.USER,
      entityId: metadata.promotedUserId,
      metadata: metadata as Record<string, unknown>,
    });
    this.logger.log('Audit: admin promoted', {
      userId,
      householdId,
      ...metadata,
    });
  }

  /**
   * Logs recipe restoration from soft-delete.
   */
  async logRestoreRecipe(
    userId: string,
    householdId: string,
    recipeId: string,
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      householdId,
      action: AUDIT_ACTIONS.RESTORE_RECIPE,
      entityType: ENTITY_TYPES.RECIPE,
      entityId: recipeId,
    });
  }

  /**
   * Logs shopping list restoration from soft-delete.
   */
  async logRestoreList(
    userId: string,
    householdId: string,
    listId: string,
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      householdId,
      action: AUDIT_ACTIONS.RESTORE_LIST,
      entityType: ENTITY_TYPES.SHOPPING_LIST,
      entityId: listId,
    });
  }

  /**
   * Logs chore restoration from soft-delete.
   */
  async logRestoreChore(
    userId: string,
    householdId: string,
    choreId: string,
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      householdId,
      action: AUDIT_ACTIONS.RESTORE_CHORE,
      entityType: ENTITY_TYPES.CHORE,
      entityId: choreId,
    });
  }

  /**
   * Logs member removal from household.
   */
  async logRemoveMember(
    userId: string,
    householdId: string,
    memberId: string,
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      householdId,
      action: AUDIT_ACTIONS.REMOVE_MEMBER,
      entityType: ENTITY_TYPES.USER,
      entityId: memberId,
      metadata: { removedBy: userId },
    });
    this.logger.log('Audit: member removed', { householdId, memberId });
  }

  /**
   * Retrieves audit trail for a specific user.
   *
   * @param userId - The ID of the user whose audit trail to retrieve
   * @param limit - Optional maximum number of entries to return (default: 100)
   * @returns Promise resolving to array of audit log entries, ordered by creation date descending
   *
   * @example
   * const trail = await auditService.getUserAuditTrail('user-123', 50);
   */
  async getUserAuditTrail(userId: string, limit?: number): Promise<AuditLog[]> {
    return this.auditRepository.findByUserId(userId, limit);
  }

  /**
   * Retrieves audit trail for a specific household.
   *
   * @param householdId - The ID of the household whose audit trail to retrieve
   * @param limit - Optional maximum number of entries to return (default: 100)
   * @returns Promise resolving to array of audit log entries, ordered by creation date descending
   *
   * @example
   * const trail = await auditService.getHouseholdAuditTrail('household-456', 25);
   */
  async getHouseholdAuditTrail(
    householdId: string,
    limit?: number,
  ): Promise<AuditLog[]> {
    return this.auditRepository.findByHouseholdId(householdId, limit);
  }
}
