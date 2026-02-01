import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdsService } from './households.service';
import { HouseholdsRepository } from '../repositories/households.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Households Service Unit Tests
 *
 * Tests household CRUD and member management, including createHousehold.
 */
describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockHouseholdId = 'household-123';
  const mockHouseholdName = 'My Household';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: HouseholdsRepository,
          useValue: {
            findHouseholdById: jest.fn(),
            findHouseholdWithMembers: jest.fn(),
            updateHousehold: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            household: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HouseholdsService>(HouseholdsService);
    prisma = module.get<PrismaService>(PrismaService);
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
      jest
        .spyOn(prisma.household, 'create')
        .mockResolvedValue({ ...mockHousehold, users: mockHousehold.users } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(undefined as any);

      const result = await service.createHousehold(mockUserId, mockHouseholdName);

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
      expect(result.id).toBe(mockHouseholdId);
      expect(result.name).toBe(mockHouseholdName);
      expect(result.members).toHaveLength(1);
      expect(result.members[0].role).toBe('Admin');
    });
  });
});
