import { Test, TestingModule } from '@nestjs/testing';
import { AuditRepository } from '../audit.repository';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

describe('AuditRepository', () => {
  let repository: AuditRepository;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AuditRepository>(AuditRepository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an audit log entry with all fields', async () => {
      const input = {
        userId: 'user-123',
        householdId: 'household-456',
        action: 'DELETE_ACCOUNT',
        entityType: 'USER',
        entityId: 'user-123',
        metadata: { reason: 'test' },
      };
      const created = {
        id: 'log-1',
        ...input,
        createdAt: new Date(),
      };
      mockPrismaService.auditLog.create.mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: input.userId,
          householdId: input.householdId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata,
        },
      });
    });

    it('should create an audit log entry without optional fields', async () => {
      const input = {
        action: 'EXPORT_DATA',
        entityType: 'USER',
        entityId: 'user-123',
      };
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-2',
        userId: undefined,
        householdId: undefined,
        ...input,
        metadata: undefined,
        createdAt: new Date(),
      });

      await repository.create(input);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return audit logs for user ordered by createdAt desc', async () => {
      const logs = [
        {
          id: '1',
          userId: 'user-1',
          householdId: null,
          action: 'EXPORT_DATA',
          entityType: 'USER',
          entityId: 'user-1',
          metadata: null,
          createdAt: new Date(),
        },
      ];
      mockPrismaService.auditLog.findMany.mockResolvedValue(logs);

      const result = await repository.findByUserId('user-1', 50);

      expect(result).toEqual(logs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should use default limit of 100', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-1');

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('findByHouseholdId', () => {
    it('should return audit logs for household', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await repository.findByHouseholdId('household-1', 20);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { householdId: 'household-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });
  });
});
