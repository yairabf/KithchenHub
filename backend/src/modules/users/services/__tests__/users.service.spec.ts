import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { UsersRepository } from '../../repositories/users.repository';
import { AuditService } from '../../../audit/services/audit.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockTx = {
    user: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    household: { findUnique: jest.fn(), delete: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    syncIdempotencyKey: { deleteMany: jest.fn() },
    householdInvite: { deleteMany: jest.fn() },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    household: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    refreshToken: { deleteMany: jest.fn() },
    syncIdempotencyKey: { deleteMany: jest.fn() },
    householdInvite: { deleteMany: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx),
    ),
  };

  const mockUsersRepository = {
    getUserExportData: jest.fn(),
  };

  const mockAuditService = {
    logAccountDeletion: jest.fn(),
    logHouseholdDeletion: jest.fn(),
    logAdminPromotion: jest.fn(),
    logDataExport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('deleteAccount', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAuditService.logAccountDeletion).not.toHaveBeenCalled();
    });

    it('should delete sole admin and household', async () => {
      const user = {
        id: 'user-1',
        householdId: 'household-1',
        role: 'Admin',
        household: { id: 'household-1' },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.household.findUnique.mockResolvedValue({
        id: 'household-1',
        users: [user],
      });
      mockTx.user.update.mockResolvedValue({});
      mockTx.household.delete.mockResolvedValue({});
      mockTx.refreshToken.deleteMany.mockResolvedValue({});
      mockTx.syncIdempotencyKey.deleteMany.mockResolvedValue({});
      mockTx.householdInvite.deleteMany.mockResolvedValue({});
      mockTx.user.delete.mockResolvedValue({});

      await service.deleteAccount('user-1', 'test reason');

      expect(mockAuditService.logHouseholdDeletion).toHaveBeenCalledWith(
        'household-1',
        { userId: 'user-1', reason: 'test reason' },
      );
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { householdId: null },
      });
      expect(mockTx.household.delete).toHaveBeenCalledWith({
        where: { id: 'household-1' },
      });
      expect(mockAuditService.logAccountDeletion).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          householdId: 'household-1',
          role: 'Admin',
          memberCount: 1,
          reason: 'test reason',
        }),
      );
      expect(mockTx.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockTx.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should promote next member and remove user when admin with multiple members', async () => {
      const user = {
        id: 'user-1',
        householdId: 'household-1',
        role: 'Admin',
        household: { id: 'household-1' },
      };
      const otherUser = {
        id: 'user-2',
        householdId: 'household-1',
        createdAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.household.findUnique.mockResolvedValue({
        id: 'household-1',
        users: [user, otherUser],
      });
      mockTx.household.findUnique.mockResolvedValue({
        id: 'household-1',
        users: [user, otherUser],
      });
      mockTx.user.update.mockResolvedValue({});
      mockTx.refreshToken.deleteMany.mockResolvedValue({});
      mockTx.syncIdempotencyKey.deleteMany.mockResolvedValue({});
      mockTx.householdInvite.deleteMany.mockResolvedValue({});
      mockTx.user.delete.mockResolvedValue({});

      await service.deleteAccount('user-1');

      expect(mockAuditService.logAdminPromotion).toHaveBeenCalledWith(
        'user-1',
        'household-1',
        { promotedUserId: 'user-2' },
      );
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { role: 'Admin' },
      });
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { householdId: null },
      });
      expect(mockTx.household.delete).not.toHaveBeenCalled();
    });

    it('should only remove from household when member', async () => {
      const memberUser = {
        id: 'user-1',
        householdId: 'household-1',
        role: 'Member',
        household: { id: 'household-1' },
      };
      mockPrismaService.user.findUnique.mockReset();
      mockPrismaService.user.findUnique.mockResolvedValue(memberUser);
      mockPrismaService.household.findUnique.mockResolvedValue({
        id: 'household-1',
        users: [memberUser, { id: 'admin-1' }],
      });
      mockTx.user.update.mockResolvedValue({});
      mockTx.refreshToken.deleteMany.mockResolvedValue({});
      mockTx.syncIdempotencyKey.deleteMany.mockResolvedValue({});
      mockTx.householdInvite.deleteMany.mockResolvedValue({});
      mockTx.user.delete.mockResolvedValue({});

      await service.deleteAccount('user-1');

      expect(mockAuditService.logAdminPromotion).not.toHaveBeenCalled();
      expect(mockAuditService.logHouseholdDeletion).not.toHaveBeenCalled();
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { householdId: null },
      });
    });
  });

  describe('exportUserData', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.getUserExportData.mockResolvedValue(null);

      await expect(service.exportUserData('user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAuditService.logDataExport).not.toHaveBeenCalled();
    });

    it('should return export DTO and log data export', async () => {
      const exportData = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test',
          role: 'Member',
          createdAt: new Date(),
        },
        household: {
          id: 'h-1',
          name: 'House',
          role: 'Member',
        },
        recipes: [{ id: 'r1' }],
        shoppingLists: [{ id: 'l1' }],
        assignedChores: [{ id: 'c1', isCompleted: true }],
      };
      mockUsersRepository.getUserExportData.mockResolvedValue(exportData);
      mockPrismaService.user.findUnique.mockResolvedValue({
        updatedAt: new Date(),
      });

      const result = await service.exportUserData('user-1');

      expect(mockAuditService.logDataExport).toHaveBeenCalledWith('user-1');
      expect(result.user.id).toBe('user-1');
      expect(result.household).not.toBeNull();
      expect(result.recipes).toHaveLength(1);
      expect(result.shoppingLists).toHaveLength(1);
      expect(result.assignedChores).toHaveLength(1);
      expect(result.activity.totalChoresCompleted).toBe(1);
      expect(result.exportedAt).toBeInstanceOf(Date);
    });
  });
});
