import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdsService } from './households.service';
import { HouseholdsRepository } from '../repositories/households.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Households Service Unit Tests
 *
 * Tests household CRUD and member management, including createHousehold.
 */
describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let prisma: PrismaService;
  let repository: HouseholdsRepository;

  const mockUserId = 'user-123';
  const mockHouseholdId = 'household-123';
  const mockHouseholdName = 'My Household';

  beforeEach(async () => {
    const userMock = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };
    const householdMock = { create: jest.fn() };
    const shoppingListMock = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    const transactionMock = jest
      .fn()
      .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: userMock,
          household: householdMock,
          shoppingList: shoppingListMock,
        };
        return fn(tx);
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: HouseholdsRepository,
          useValue: {
            findHouseholdById: jest.fn(),
            findHouseholdWithMembers: jest.fn(),
            updateHousehold: jest.fn(),
            createHousehold: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: userMock,
            household: householdMock,
            shoppingList: shoppingListMock,
            $transaction: transactionMock,
          },
        },
      ],
    }).compile();

    service = module.get<HouseholdsService>(HouseholdsService);
    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<HouseholdsRepository>(HouseholdsRepository);
  });

  describe('createHousehold', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createHousehold(mockUserId, mockHouseholdName),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.household.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user already has a household', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        householdId: mockHouseholdId,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        service.createHousehold(mockUserId, mockHouseholdName),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.household.create).not.toHaveBeenCalled();
    });

    it('should create household and set user as Admin when user has no household', async () => {
      const mockUser = {
        id: mockUserId,
        householdId: null,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockHousehold = {
        id: mockHouseholdId,
        name: mockHouseholdName,
        users: [
          {
            id: mockUserId,
            email: 'u@example.com',
            name: 'User',
            avatarUrl: null,
            role: 'Admin',
          },
        ],
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.household, 'create').mockResolvedValue({
        ...mockHousehold,
        users: mockHousehold.users,
      } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(undefined as any);

      const result = await service.createHousehold(
        mockUserId,
        mockHouseholdName,
      );

      expect(prisma.household.create).toHaveBeenCalledWith({
        data: {
          name: mockHouseholdName,
          users: { connect: { id: mockUserId } },
        },
        include: { users: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { role: 'Admin' },
      });
      expect(prisma.shoppingList.create).toHaveBeenCalledWith({
        data: {
          householdId: mockHouseholdId,
          name: 'Weekly Shopping',
          color: '#4CAF50',
          icon: 'cart-outline',
          isMain: true,
        },
      });
      expect(result.id).toBe(mockHouseholdId);
      expect(result.name).toBe(mockHouseholdName);
      expect(result.members).toHaveLength(1);
      expect(result.members[0].role).toBe('Admin');
    });
  });

  describe('createHouseholdForNewUser', () => {
    it('should create household without optional id and set user as Admin', async () => {
      const mockUser = {
        id: mockUserId,
        householdId: null,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockHousehold = {
        id: mockHouseholdId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest
        .spyOn(repository, 'createHousehold')
        .mockResolvedValue(mockHousehold as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(undefined as any);

      const result = await service.createHouseholdForNewUser(
        mockUserId,
        mockHouseholdName,
      );

      expect(repository.createHousehold).toHaveBeenCalledWith(
        mockHouseholdName,
        undefined,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { householdId: mockHouseholdId, role: 'Admin' },
      });
      expect(result).toBe(mockHouseholdId);
    });

    it('should create household with optional id when provided', async () => {
      const customId = 'custom-household-id';
      const mockUser = {
        id: mockUserId,
        householdId: null,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockHousehold = {
        id: customId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest
        .spyOn(repository, 'createHousehold')
        .mockResolvedValue(mockHousehold as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(undefined as any);

      const result = await service.createHouseholdForNewUser(
        mockUserId,
        mockHouseholdName,
        customId,
      );

      expect(repository.createHousehold).toHaveBeenCalledWith(
        mockHouseholdName,
        customId,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { householdId: customId, role: 'Admin' },
      });
      expect(result).toBe(customId);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createHouseholdForNewUser(mockUserId, mockHouseholdName),
      ).rejects.toThrow(NotFoundException);
      expect(repository.createHousehold).not.toHaveBeenCalled();
    });

    it('should return existing household id when user already has a household (race-safe)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        householdId: mockHouseholdId,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.createHouseholdForNewUser(
        mockUserId,
        mockHouseholdName,
      );

      expect(result).toBe(mockHouseholdId);
      expect(repository.createHousehold).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('addUserToHousehold', () => {
    it('should add user to existing household as Member', async () => {
      const mockHousehold = {
        id: mockHouseholdId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockUser = {
        id: mockUserId,
        householdId: null,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, 'findHouseholdById')
        .mockResolvedValue(mockHousehold as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(undefined as any);

      await service.addUserToHousehold(mockHouseholdId, mockUserId);

      expect(repository.findHouseholdById).toHaveBeenCalledWith(
        mockHouseholdId,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { householdId: mockHouseholdId, role: 'Member' },
      });
    });

    it('should throw NotFoundException when household does not exist', async () => {
      jest.spyOn(repository, 'findHouseholdById').mockResolvedValue(null);

      await expect(
        service.addUserToHousehold(mockHouseholdId, mockUserId),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(repository, 'findHouseholdById').mockResolvedValue({
        id: mockHouseholdId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.addUserToHousehold(mockHouseholdId, mockUserId),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should no-op when user is already in the same household (idempotent)', async () => {
      jest.spyOn(repository, 'findHouseholdById').mockResolvedValue({
        id: mockHouseholdId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        householdId: mockHouseholdId,
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.addUserToHousehold(mockHouseholdId, mockUserId);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user already has a different household', async () => {
      jest.spyOn(repository, 'findHouseholdById').mockResolvedValue({
        id: mockHouseholdId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        householdId: 'other-household-id',
        email: 'u@example.com',
        name: 'User',
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        service.addUserToHousehold(mockHouseholdId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('validateInviteCode', () => {
    it('should return householdId and householdName for valid invite code', async () => {
      const code = `invite_${mockHouseholdId}_${Date.now()}`;
      const mockHousehold = {
        id: mockHouseholdId,
        name: mockHouseholdName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(repository, 'findHouseholdById')
        .mockResolvedValue(mockHousehold as any);

      const result = await service.validateInviteCode(code);

      expect(repository.findHouseholdById).toHaveBeenCalledWith(
        mockHouseholdId,
      );
      expect(result).toEqual({
        householdId: mockHouseholdId,
        householdName: mockHouseholdName,
      });
    });

    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
    ])(
      'should throw BadRequestException when code is %s',
      async (_description, code) => {
        await expect(service.validateInviteCode(code)).rejects.toThrow(
          BadRequestException,
        );
        expect(repository.findHouseholdById).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['invalid_format', 'invalid_format'],
      ['invite_ only', 'invite_'],
      ['wrong prefix', 'wrong_prefix_abc_123'],
    ])(
      'should throw BadRequestException for invalid format: %s',
      async (_description, code) => {
        await expect(service.validateInviteCode(code)).rejects.toThrow(
          BadRequestException,
        );
        expect(repository.findHouseholdById).not.toHaveBeenCalled();
      },
    );

    it('should throw NotFoundException when household does not exist', async () => {
      const code = `invite_nonexistent_${Date.now()}`;
      jest.spyOn(repository, 'findHouseholdById').mockResolvedValue(null);

      await expect(service.validateInviteCode(code)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findHouseholdById).toHaveBeenCalledWith('nonexistent');
    });
  });
});
