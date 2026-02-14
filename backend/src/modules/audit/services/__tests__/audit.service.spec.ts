import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit.service';
import { AuditRepository } from '../../repositories/audit.repository';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditRepository = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findByHouseholdId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditRepository,
          useValue: mockAuditRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('logAccountDeletion', () => {
    it('should create audit log with metadata', async () => {
      mockAuditRepository.create.mockResolvedValue({});

      await service.logAccountDeletion('user-1', {
        householdId: 'h-1',
        role: 'Admin',
        memberCount: 1,
        reason: 'test',
      });

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          householdId: 'h-1',
          action: 'DELETE_ACCOUNT',
          entityType: 'USER',
          entityId: 'user-1',
          metadata: expect.objectContaining({
            householdId: 'h-1',
            role: 'Admin',
            memberCount: 1,
            reason: 'test',
          }),
        }),
      );
    });
  });

  describe('logHouseholdDeletion', () => {
    it('should create audit log for household deletion', async () => {
      mockAuditRepository.create.mockResolvedValue({});

      await service.logHouseholdDeletion('household-1', {
        userId: 'user-1',
        reason: 'account deleted',
      });

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId: 'household-1',
          action: 'DELETE_HOUSEHOLD',
          entityType: 'HOUSEHOLD',
          entityId: 'household-1',
        }),
      );
    });
  });

  describe('logDataExport', () => {
    it('should create audit log for data export', async () => {
      mockAuditRepository.create.mockResolvedValue({});

      await service.logDataExport('user-1');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          action: 'EXPORT_DATA',
          entityType: 'USER',
          entityId: 'user-1',
        }),
      );
    });
  });

  describe('logAdminPromotion', () => {
    it('should create audit log for admin promotion', async () => {
      mockAuditRepository.create.mockResolvedValue({});

      await service.logAdminPromotion('user-1', 'household-1', {
        promotedUserId: 'user-2',
      });

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          householdId: 'household-1',
          action: 'ADMIN_PROMOTE',
          entityType: 'USER',
          entityId: 'user-2',
          metadata: { promotedUserId: 'user-2' },
        }),
      );
    });
  });

  describe('logRemoveMember', () => {
    it('should create audit log for member removal', async () => {
      mockAuditRepository.create.mockResolvedValue({});

      await service.logRemoveMember('admin-1', 'household-1', 'member-1');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          householdId: 'household-1',
          action: 'REMOVE_MEMBER',
          entityType: 'USER',
          entityId: 'member-1',
        }),
      );
    });
  });

  describe('getUserAuditTrail', () => {
    it('should return audit logs for user', async () => {
      const logs = [{ id: '1', action: 'EXPORT_DATA' }];
      mockAuditRepository.findByUserId.mockResolvedValue(logs);

      const result = await service.getUserAuditTrail('user-1', 50);

      expect(result).toEqual(logs);
      expect(mockAuditRepository.findByUserId).toHaveBeenCalledWith(
        'user-1',
        50,
      );
    });
  });

  describe('getHouseholdAuditTrail', () => {
    it('should return audit logs for household', async () => {
      const logs = [{ id: '1', action: 'REMOVE_MEMBER' }];
      mockAuditRepository.findByHouseholdId.mockResolvedValue(logs);

      const result = await service.getHouseholdAuditTrail('household-1', 30);

      expect(result).toEqual(logs);
      expect(mockAuditRepository.findByHouseholdId).toHaveBeenCalledWith(
        'household-1',
        30,
      );
    });
  });
});
