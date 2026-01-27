import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../../repositories/auth.repository';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { UuidService } from '../../../../common/services/uuid.service';
import {
  SyncDataDto,
  SyncRecipeDto,
  SyncShoppingListDto,
  SyncChoreDto,
} from '../../dtos';

// Mock loadConfiguration to avoid environment variable validation in tests
jest.mock('../../../../config/configuration', () => ({
  loadConfiguration: jest.fn(() => ({
    google: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    },
    jwt: {
      secret: 'test-jwt-secret-32-characters-long',
      refreshSecret: 'test-refresh-secret-32-characters-long',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  })),
}));

describe('AuthService - Idempotency', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    shoppingList: {
      upsert: jest.fn(),
    },
    shoppingItem: {
      upsert: jest.fn(),
    },
    recipe: {
      upsert: jest.fn(),
    },
    chore: {
      upsert: jest.fn(),
    },
    syncIdempotencyKey: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockAuthRepository = {
    createRefreshToken: jest.fn(),
  };

  const mockUuidService = {
    generate: jest.fn(),
  };

  const userId = 'user-123';
  const householdId = 'household-123';
  const mockUser = {
    id: userId,
    householdId,
    email: 'test@example.com',
    name: 'Test User',
    isGuest: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: UuidService,
          useValue: mockUuidService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Setup default mocks
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockJwtService.signAsync.mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processEntityWithIdempotency - atomic idempotency checking', () => {
    const operationId = 'test-operation-id-123';
    const entityId = 'entity-123';
    const requestId = 'request-123';

    describe.each([
      ['recipe', 'recipe', 'recipe'],
      ['shoppingList', 'shoppingList', 'shoppingList'],
      ['shoppingItem', 'shoppingItem', 'shoppingItem'],
      ['chore', 'chore', 'chore'],
    ])('for %s entities', (description, entityType) => {
      it('should process entity when operationId is new', async () => {
        const processFn = jest.fn().mockResolvedValue(undefined);
        const mockIdempotencyKey = { id: 'key-123' };

        mockPrismaService.syncIdempotencyKey.create.mockResolvedValue(mockIdempotencyKey);
        mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(mockIdempotencyKey);
        mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

        // Use reflection to access private method
        await (service as any).processEntityWithIdempotency(
          userId,
          operationId,
          entityType,
          entityId,
          requestId,
          processFn,
        );

        expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalledWith({
          data: {
            userId,
            key: operationId,
            entityType,
            entityId,
            requestId,
            status: 'PENDING',
          },
        });
        expect(processFn).toHaveBeenCalled();
        expect(mockPrismaService.syncIdempotencyKey.update).toHaveBeenCalledWith({
          where: { id: mockIdempotencyKey.id },
          data: {
            status: 'COMPLETED',
            processedAt: expect.any(Date),
          },
        });
      });

      it('should skip processing when operationId already exists (duplicate)', async () => {
        const processFn = jest.fn().mockResolvedValue(undefined);
        const uniqueConstraintError = {
          code: 'P2002',
          meta: { target: ['userId', 'key'] },
        };

        mockPrismaService.syncIdempotencyKey.create.mockRejectedValue(uniqueConstraintError);

        await (service as any).processEntityWithIdempotency(
          userId,
          operationId,
          entityType,
          entityId,
          requestId,
          processFn,
        );

        expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalled();
        expect(processFn).not.toHaveBeenCalled();
        expect(mockPrismaService.syncIdempotencyKey.update).not.toHaveBeenCalled();
      });

      it('should delete idempotency key and re-throw error when processing fails', async () => {
        const processError = new Error('Processing failed');
        const processFn = jest.fn().mockRejectedValue(processError);
        const mockIdempotencyKey = { id: 'key-123' };

        mockPrismaService.syncIdempotencyKey.create.mockResolvedValue(mockIdempotencyKey);
        mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(mockIdempotencyKey);
        mockPrismaService.syncIdempotencyKey.delete.mockResolvedValue(undefined);

        await expect(
          (service as any).processEntityWithIdempotency(
            userId,
            operationId,
            entityType,
            entityId,
            requestId,
            processFn,
          ),
        ).rejects.toThrow('Processing failed');

        expect(processFn).toHaveBeenCalled();
        expect(mockPrismaService.syncIdempotencyKey.delete).toHaveBeenCalledWith({
          where: { id: mockIdempotencyKey.id },
        });
      });
    });
  });

  describe('syncData - idempotency integration', () => {
    it('should include operationId in sync requests', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-123',
            operationId: 'op-recipe-123',
            title: 'Test Recipe',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
        ],
        requestId: 'request-123',
      };

      const mockIdempotencyKey = { id: 'key-123' };
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValue(mockIdempotencyKey);
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(mockIdempotencyKey);
      mockPrismaService.recipe.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      const result = await service.syncData(userId, syncData);

      expect(result.status).toBe('synced');
      expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'op-recipe-123',
          entityType: 'recipe',
          entityId: 'recipe-123',
          requestId: 'request-123',
        }),
      });
    });

    it('should skip duplicate operations based on operationId', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-123',
            operationId: 'op-recipe-123',
            title: 'Test Recipe',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
        ],
      };

      const uniqueConstraintError = {
        code: 'P2002',
        meta: { target: ['userId', 'key'] },
      };

      // First call succeeds
      const mockIdempotencyKey = { id: 'key-123' };
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValueOnce(mockIdempotencyKey);
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(mockIdempotencyKey);
      mockPrismaService.recipe.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      await service.syncData(userId, syncData);

      // Second call with same operationId should be skipped
      mockPrismaService.syncIdempotencyKey.create.mockRejectedValueOnce(uniqueConstraintError);

      const result2 = await service.syncData(userId, syncData);

      expect(result2.status).toBe('synced');
      expect(mockPrismaService.recipe.upsert).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle nested items with their own operationIds', async () => {
      const syncData: SyncDataDto = {
        lists: [
          {
            id: 'list-123',
            operationId: 'op-list-123',
            name: 'Grocery List',
            items: [
              {
                id: 'item-123',
                operationId: 'op-item-123',
                name: 'Milk',
                quantity: 1,
                unit: 'gallon',
              },
            ],
          },
        ],
      };

      const mockListKey = { id: 'key-list-123' };
      const mockItemKey = { id: 'key-item-123' };

      mockPrismaService.syncIdempotencyKey.create
        .mockResolvedValueOnce(mockListKey) // List key
        .mockResolvedValueOnce(mockItemKey); // Item key

      mockPrismaService.syncIdempotencyKey.findFirst
        .mockResolvedValueOnce(mockListKey)
        .mockResolvedValueOnce(mockItemKey);

      mockPrismaService.shoppingList.upsert.mockResolvedValue({});
      mockPrismaService.shoppingItem.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      const result = await service.syncData(userId, syncData);

      expect(result.status).toBe('synced');
      expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'op-list-123',
          entityType: 'shoppingList',
        }),
      });
      expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'op-item-123',
          entityType: 'shoppingItem',
        }),
      });
    });
  });

  describe('concurrent request handling', () => {
    it('should handle concurrent requests with same operationId (only one processes)', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-123',
            operationId: 'op-recipe-123',
            title: 'Test Recipe',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
        ],
      };

      const uniqueConstraintError = {
        code: 'P2002',
        meta: { target: ['userId', 'key'] },
      };

      // First request succeeds
      const mockIdempotencyKey = { id: 'key-123' };
      mockPrismaService.syncIdempotencyKey.create
        .mockResolvedValueOnce(mockIdempotencyKey) // First request succeeds
        .mockRejectedValueOnce(uniqueConstraintError); // Second request gets duplicate

      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(mockIdempotencyKey);
      mockPrismaService.recipe.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      // Simulate concurrent requests
      const [result1, result2] = await Promise.all([
        service.syncData(userId, syncData),
        service.syncData(userId, syncData),
      ]);

      expect(result1.status).toBe('synced');
      expect(result2.status).toBe('synced');
      // Recipe should only be upserted once (first request)
      expect(mockPrismaService.recipe.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
