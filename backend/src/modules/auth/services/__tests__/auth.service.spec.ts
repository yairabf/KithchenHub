import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../../repositories/auth.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HouseholdsService } from '../../../households/services/households.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { UuidService } from '../../../../common/services/uuid.service';
import { SyncDataDto, UserCreationHouseholdDto } from '../../dtos';

/** Interface used to cast AuthService when testing private methods (avoids intersection with private members). */
interface AuthServicePrivateTestAccess {
  deriveDefaultHouseholdName(
    email: string,
    displayName?: string | null,
  ): string;
  resolveAndAttachHousehold(
    userId: string,
    household: UserCreationHouseholdDto,
  ): Promise<void>;
}

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

  const mockHouseholdsService = {
    createHouseholdForNewUser: jest.fn(),
    addUserToHousehold: jest.fn(),
  };

  const userId = 'user-123';
  const householdId = 'household-123';
  const mockUser = {
    id: userId,
    householdId,
    email: 'test@example.com',
    name: 'Test User',
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
        {
          provide: HouseholdsService,
          useValue: mockHouseholdsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    module.get<PrismaService>(PrismaService);

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

        mockPrismaService.syncIdempotencyKey.create.mockResolvedValue(
          mockIdempotencyKey,
        );
        mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(
          mockIdempotencyKey,
        );
        mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(
          undefined,
        );

        // Use reflection to access private method
        await (service as any).processEntityWithIdempotency(
          userId,
          operationId,
          entityType,
          entityId,
          requestId,
          processFn,
        );

        expect(
          mockPrismaService.syncIdempotencyKey.create,
        ).toHaveBeenCalledWith({
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
        expect(
          mockPrismaService.syncIdempotencyKey.update,
        ).toHaveBeenCalledWith({
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

        mockPrismaService.syncIdempotencyKey.create.mockRejectedValue(
          uniqueConstraintError,
        );

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
        expect(
          mockPrismaService.syncIdempotencyKey.update,
        ).not.toHaveBeenCalled();
      });

      it('should delete idempotency key and re-throw error when processing fails', async () => {
        const processError = new Error('Processing failed');
        const processFn = jest.fn().mockRejectedValue(processError);
        const mockIdempotencyKey = { id: 'key-123' };

        mockPrismaService.syncIdempotencyKey.create.mockResolvedValue(
          mockIdempotencyKey,
        );
        mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(
          mockIdempotencyKey,
        );
        mockPrismaService.syncIdempotencyKey.delete.mockResolvedValue(
          undefined,
        );

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
        expect(
          mockPrismaService.syncIdempotencyKey.delete,
        ).toHaveBeenCalledWith({
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
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValue(
        mockIdempotencyKey,
      );
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(
        mockIdempotencyKey,
      );
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
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValueOnce(
        mockIdempotencyKey,
      );
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(
        mockIdempotencyKey,
      );
      mockPrismaService.recipe.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      await service.syncData(userId, syncData);

      // Second call with same operationId should be skipped
      mockPrismaService.syncIdempotencyKey.create.mockRejectedValueOnce(
        uniqueConstraintError,
      );

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
      expect(mockPrismaService.syncIdempotencyKey.create).toHaveBeenCalledTimes(
        2,
      );
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

      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValue(
        mockIdempotencyKey,
      );
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

  describe('syncData - partial batch recovery', () => {
    it('should return succeeded array with operationIds for successful entities', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
          {
            id: 'recipe-2',
            operationId: 'op-recipe-2',
            title: 'Recipe 2',
            ingredients: [{ name: 'Sugar' }],
            instructions: [{ step: 1, instruction: 'Stir' }],
          },
        ],
      };

      const mockIdempotencyKey1 = { id: 'key-1' };
      const mockIdempotencyKey2 = { id: 'key-2' };

      mockPrismaService.syncIdempotencyKey.create
        .mockResolvedValueOnce(mockIdempotencyKey1)
        .mockResolvedValueOnce(mockIdempotencyKey2);
      mockPrismaService.syncIdempotencyKey.findFirst
        .mockResolvedValueOnce(mockIdempotencyKey1)
        .mockResolvedValueOnce(mockIdempotencyKey2);
      mockPrismaService.recipe.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      const result = await service.syncData(userId, syncData);

      expect(result.status).toBe('synced');
      expect(result.succeeded).toBeDefined();
      expect(result.succeeded?.length).toBe(2);
      expect(
        result.succeeded?.some((s) => s.operationId === 'op-recipe-1'),
      ).toBe(true);
      expect(
        result.succeeded?.some((s) => s.operationId === 'op-recipe-2'),
      ).toBe(true);
      expect(result.succeeded?.every((s) => s.entityType === 'recipe')).toBe(
        true,
      );
    });

    it('should return both succeeded and conflicts for partial failures', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
          {
            id: 'recipe-2',
            operationId: 'op-recipe-2',
            title: 'Recipe 2',
            ingredients: [{ name: 'Sugar' }],
            instructions: [{ step: 1, instruction: 'Stir' }],
          },
        ],
      };

      const mockIdempotencyKey1 = { id: 'key-1' };
      const mockIdempotencyKey2 = { id: 'key-2' };

      // First recipe succeeds
      mockPrismaService.syncIdempotencyKey.create
        .mockResolvedValueOnce(mockIdempotencyKey1)
        .mockResolvedValueOnce(mockIdempotencyKey2);
      mockPrismaService.syncIdempotencyKey.findFirst
        .mockResolvedValueOnce(mockIdempotencyKey1)
        .mockResolvedValueOnce(mockIdempotencyKey2);
      mockPrismaService.recipe.upsert
        .mockResolvedValueOnce({}) // First recipe succeeds
        .mockRejectedValueOnce(new Error('Validation failed')); // Second recipe fails
      mockPrismaService.syncIdempotencyKey.update
        .mockResolvedValueOnce(undefined) // First recipe completes
        .mockResolvedValueOnce(undefined); // Second recipe key deleted after failure
      mockPrismaService.syncIdempotencyKey.delete.mockResolvedValueOnce(
        undefined,
      );

      const result = await service.syncData(userId, syncData);

      expect(result.status).toBe('partial');
      expect(result.succeeded).toBeDefined();
      expect(result.succeeded?.length).toBe(1);
      expect(
        result.succeeded?.some((s) => s.operationId === 'op-recipe-1'),
      ).toBe(true);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].operationId).toBe('op-recipe-2');
      expect(result.conflicts[0].type).toBe('recipe');
    });

    it('should include operationId in conflicts', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
        ],
      };

      const mockIdempotencyKey = { id: 'key-1' };
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValueOnce(
        mockIdempotencyKey,
      );
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValueOnce(
        mockIdempotencyKey,
      );
      mockPrismaService.recipe.upsert.mockRejectedValueOnce(
        new Error('Validation failed'),
      );
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValueOnce(
        undefined,
      );
      mockPrismaService.syncIdempotencyKey.delete.mockResolvedValueOnce(
        undefined,
      );

      const result = await service.syncData(userId, syncData);

      expect(result.status).toBe('failed');
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].operationId).toBe('op-recipe-1');
      expect(result.conflicts[0].id).toBe('recipe-1');
      expect(result.conflicts[0].type).toBe('recipe');
    });

    it('should calculate status correctly: synced vs partial vs failed', async () => {
      // Test 'synced' status
      const syncData1: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
        ],
      };

      const mockKey1 = { id: 'key-1' };
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValueOnce(
        mockKey1,
      );
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValueOnce(
        mockKey1,
      );
      mockPrismaService.recipe.upsert.mockResolvedValueOnce({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValueOnce(
        undefined,
      );

      const result1 = await service.syncData(userId, syncData1);
      expect(result1.status).toBe('synced');
      expect(result1.conflicts.length).toBe(0);

      // Test 'partial' status
      const syncData2: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
          {
            id: 'recipe-2',
            operationId: 'op-recipe-2',
            title: 'Recipe 2',
            ingredients: [{ name: 'Sugar' }],
            instructions: [{ step: 1, instruction: 'Stir' }],
          },
        ],
      };

      const mockKey2 = { id: 'key-2' };
      mockPrismaService.syncIdempotencyKey.create
        .mockResolvedValueOnce(mockKey1)
        .mockResolvedValueOnce(mockKey2);
      mockPrismaService.syncIdempotencyKey.findFirst
        .mockResolvedValueOnce(mockKey1)
        .mockResolvedValueOnce(mockKey2);
      mockPrismaService.recipe.upsert
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Validation failed'));
      mockPrismaService.syncIdempotencyKey.update
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockPrismaService.syncIdempotencyKey.delete.mockResolvedValueOnce(
        undefined,
      );

      const result2 = await service.syncData(userId, syncData2);
      expect(result2.status).toBe('partial');
      expect(result2.succeeded?.length).toBe(1);
      expect(result2.conflicts.length).toBe(1);

      // Test 'failed' status
      const syncData3: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
        ],
      };

      const mockKey3 = { id: 'key-3' };
      mockPrismaService.syncIdempotencyKey.create.mockResolvedValueOnce(
        mockKey3,
      );
      mockPrismaService.syncIdempotencyKey.findFirst.mockResolvedValueOnce(
        mockKey3,
      );
      mockPrismaService.recipe.upsert.mockRejectedValueOnce(
        new Error('Validation failed'),
      );
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValueOnce(
        undefined,
      );
      mockPrismaService.syncIdempotencyKey.delete.mockResolvedValueOnce(
        undefined,
      );

      const result3 = await service.syncData(userId, syncData3);
      expect(result3.status).toBe('failed');
      expect(result3.succeeded).toBeUndefined();
      expect(result3.conflicts.length).toBe(1);
    });

    it('should track nested shopping items separately', async () => {
      const syncData: SyncDataDto = {
        lists: [
          {
            id: 'list-1',
            operationId: 'op-list-1',
            name: 'Grocery List',
            items: [
              {
                id: 'item-1',
                operationId: 'op-item-1',
                name: 'Milk',
              },
              {
                id: 'item-2',
                operationId: 'op-item-2',
                name: 'Bread',
              },
            ],
          },
        ],
      };

      const mockListKey = { id: 'key-list' };
      const mockItemKey1 = { id: 'key-item-1' };
      const mockItemKey2 = { id: 'key-item-2' };

      mockPrismaService.syncIdempotencyKey.create
        .mockResolvedValueOnce(mockListKey)
        .mockResolvedValueOnce(mockItemKey1)
        .mockResolvedValueOnce(mockItemKey2);
      mockPrismaService.syncIdempotencyKey.findFirst
        .mockResolvedValueOnce(mockListKey)
        .mockResolvedValueOnce(mockItemKey1)
        .mockResolvedValueOnce(mockItemKey2);
      mockPrismaService.shoppingList.upsert.mockResolvedValue({});
      mockPrismaService.shoppingItem.upsert.mockResolvedValue({});
      mockPrismaService.syncIdempotencyKey.update.mockResolvedValue(undefined);

      const result = await service.syncData(userId, syncData);

      expect(result.status).toBe('synced');
      expect(result.succeeded).toBeDefined();
      // Should include list + 2 items = 3 succeeded
      expect(result.succeeded?.length).toBe(3);
      expect(result.succeeded?.some((s) => s.operationId === 'op-list-1')).toBe(
        true,
      );
      expect(result.succeeded?.some((s) => s.operationId === 'op-item-1')).toBe(
        true,
      );
      expect(result.succeeded?.some((s) => s.operationId === 'op-item-2')).toBe(
        true,
      );
    });

    it('should log error when invariant is violated (missing operationIds)', async () => {
      const syncData: SyncDataDto = {
        recipes: [
          {
            id: 'recipe-1',
            operationId: 'op-recipe-1',
            title: 'Recipe 1',
            ingredients: [{ name: 'Flour' }],
            instructions: [{ step: 1, instruction: 'Mix' }],
          },
          {
            id: 'recipe-2',
            operationId: 'op-recipe-2',
            title: 'Recipe 2',
            ingredients: [{ name: 'Sugar' }],
            instructions: [{ step: 1, instruction: 'Stir' }],
          },
        ],
      };

      // Mock logger
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      // Mock syncRecipes to return incomplete results (simulating a bug)
      // This simulates a scenario where syncRecipes doesn't track all operationIds
      const originalSyncRecipes = service['syncRecipes'].bind(service);
      service['syncRecipes'] = jest.fn().mockResolvedValue({
        succeeded: [
          {
            operationId: 'op-recipe-1',
            id: 'recipe-1',
            clientLocalId: 'recipe-1',
          },
        ],
        conflicts: [],
        // Missing op-recipe-2 to violate invariant
      });

      const result = await service.syncData(userId, syncData);

      // Verify error was logged with context
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Sync result invariant violated: missing operationIds',
        expect.objectContaining({
          userId,
          requestId: syncData.requestId,
          missingOperationIds: expect.arrayContaining([
            expect.objectContaining({
              operationId: 'op-recipe-2',
              type: 'recipe',
              id: 'recipe-2',
            }),
          ]),
          expectedCount: 2,
          actualCount: 1,
        }),
      );

      // Verify sync still completes (doesn't throw)
      expect(result).toBeDefined();
      expect(result.status).toBe('synced');

      // Restore original method
      service['syncRecipes'] = originalSyncRecipes;
    });
  });
});

describe('AuthService - authenticateGoogle household payload', () => {
  let service: AuthService;

  const mockUserId = 'user-123';
  const mockHouseholdId = 'household-123';

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    shoppingList: { upsert: jest.fn() },
    shoppingItem: { upsert: jest.fn() },
    recipe: { upsert: jest.fn() },
    chore: { upsert: jest.fn() },
    syncIdempotencyKey: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = { signAsync: jest.fn().mockResolvedValue('token') };

  const mockAuthRepository = {
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserByGoogleId: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    createRefreshToken: jest.fn(),
  };

  const mockUuidService = { generate: jest.fn() };

  const mockHouseholdsService = {
    createHouseholdForNewUser: jest.fn().mockResolvedValue(mockHouseholdId),
    addUserToHousehold: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: UuidService, useValue: mockUuidService },
        { provide: HouseholdsService, useValue: mockHouseholdsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('deriveDefaultHouseholdName', () => {
    it.each([
      ['John', 'john@example.com', "John's family"],
      ['John Doe', 'john.doe@example.com', "John Doe's family"],
      ['alice', 'alice@test.com', "Alice's family"],
    ])(
      'should use display name when present: "%s" -> "%s"',
      (displayName, email, expected) => {
        expect(
          (
            service as unknown as AuthServicePrivateTestAccess
          ).deriveDefaultHouseholdName(email, displayName),
        ).toBe(expected);
      },
    );

    it.each([
      ['john.doe@gmail.com', "John Doe's family"],
      ['alice@test.com', "Alice's family"],
      ['BOB@example.com', "Bob's family"],
    ])(
      'should use email local-part when no display name: %s -> %s',
      (email, expected) => {
        expect(
          (
            service as unknown as AuthServicePrivateTestAccess
          ).deriveDefaultHouseholdName(email),
        ).toBe(expected);
      },
    );

    it('should return "My family" when email and display name empty', () => {
      expect(
        (
          service as unknown as AuthServicePrivateTestAccess
        ).deriveDefaultHouseholdName('', ''),
      ).toBe('My family');
    });

    it('should return "My family" when email empty and no display name', () => {
      expect(
        (
          service as unknown as AuthServicePrivateTestAccess
        ).deriveDefaultHouseholdName(''),
      ).toBe('My family');
    });

    it('should treat whitespace-only display name as empty and fallback to email', () => {
      expect(
        (
          service as unknown as AuthServicePrivateTestAccess
        ).deriveDefaultHouseholdName('john@example.com', '   '),
      ).toBe("John's family");
    });

    it('should trim and title-case display name', () => {
      expect(
        (
          service as unknown as AuthServicePrivateTestAccess
        ).deriveDefaultHouseholdName('x@x.com', '  jane doe  '),
      ).toBe("Jane Doe's family");
    });
  });

  describe('authenticateGoogle', () => {
    const googlePayload = {
      email: 'test@example.com',
      name: 'Test',
      sub: mockUserId,
    };

    function setupGoogleClient(): void {
      (
        service as unknown as AuthServicePrivateTestAccess & {
          googleClient: unknown;
        }
      ).googleClient = {
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => googlePayload,
        }),
      };
    }

    function mockUserWithHousehold(householdId: string | null) {
      return {
        id: mockUserId,
        householdId,
        email: googlePayload.email,
        name: googlePayload.name,
        avatarUrl: null,
        role: 'Member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    it('should throw BadRequestException when existing user has household and dto.household is present', async () => {
      setupGoogleClient();
      // Reset mocks before setting up
      jest.clearAllMocks();
      // Ensure mocks are properly set up
      mockAuthRepository.findUserByGoogleId = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.updateUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.findUserById = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));

      await expect(
        service.authenticateGoogle({
          idToken: 'token',
          household: { id: 'other-household-id' },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).not.toHaveBeenCalled();
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
    });

    it('should succeed without household calls when existing user has household and no dto.household', async () => {
      setupGoogleClient();
      jest.clearAllMocks();
      mockAuthRepository.findUserByGoogleId = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.updateUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.findUserById = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));

      const result = await service.authenticateGoogle({ idToken: 'token' });

      expect(result).toHaveProperty('accessToken');
      expect(result.householdId).toBe(mockHouseholdId);
      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).not.toHaveBeenCalled();
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
    });

    it('should create household with default name when new user and no dto.household', async () => {
      setupGoogleClient();
      jest.clearAllMocks();
      mockUuidService.generate = jest.fn().mockReturnValue(mockUserId);
      mockAuthRepository.findUserByGoogleId = jest.fn().mockResolvedValue(null);
      mockAuthRepository.findUserByEmail = jest.fn().mockResolvedValue(null);
      mockAuthRepository.findUserById = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.createUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(null));
      mockAuthRepository.updateUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));

      const result = await service.authenticateGoogle({ idToken: 'token' });

      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).toHaveBeenCalledWith(mockUserId, "Test's family", undefined);
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
      expect(result.householdId).toBe(mockHouseholdId);
    });

    it('should call addUserToHousehold when new user and dto.household has id (join)', async () => {
      setupGoogleClient();
      jest.clearAllMocks();
      mockUuidService.generate = jest.fn().mockReturnValue(mockUserId);
      mockAuthRepository.findUserByGoogleId = jest.fn().mockResolvedValue(null);
      mockAuthRepository.findUserByEmail = jest.fn().mockResolvedValue(null);
      mockAuthRepository.findUserById = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.createUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(null));
      mockAuthRepository.updateUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));

      await service.authenticateGoogle({
        idToken: 'token',
        household: { id: mockHouseholdId },
      });

      expect(mockHouseholdsService.addUserToHousehold).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
      );
      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).not.toHaveBeenCalled();
    });

    it('should call createHouseholdForNewUser when new user and dto.household has name', async () => {
      setupGoogleClient();
      jest.clearAllMocks();
      mockUuidService.generate = jest.fn().mockReturnValue(mockUserId);
      mockAuthRepository.findUserByGoogleId = jest.fn().mockResolvedValue(null);
      mockAuthRepository.findUserByEmail = jest.fn().mockResolvedValue(null);
      mockAuthRepository.findUserById = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));
      mockAuthRepository.createUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(null));
      mockAuthRepository.updateUser = jest
        .fn()
        .mockResolvedValue(mockUserWithHousehold(mockHouseholdId));

      await service.authenticateGoogle({
        idToken: 'token',
        household: { name: 'My Household' },
      });

      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).toHaveBeenCalledWith(mockUserId, 'My Household', undefined);
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
    });
  });

  describe('resolveAndAttachHousehold', () => {
    it('should call createHouseholdForNewUser when household has name (new household)', async () => {
      await (
        service as unknown as AuthServicePrivateTestAccess
      ).resolveAndAttachHousehold(mockUserId, {
        name: 'My Household',
      });

      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).toHaveBeenCalledWith(mockUserId, 'My Household', undefined);
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
    });

    it('should call createHouseholdForNewUser with optional id when both name and id provided', async () => {
      await (
        service as unknown as AuthServicePrivateTestAccess
      ).resolveAndAttachHousehold(mockUserId, {
        name: 'My Household',
        id: 'custom-household-id',
      });

      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).toHaveBeenCalledWith(mockUserId, 'My Household', 'custom-household-id');
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
    });

    it('should call addUserToHousehold when household has only id (existing household)', async () => {
      await (
        service as unknown as AuthServicePrivateTestAccess
      ).resolveAndAttachHousehold(mockUserId, {
        id: mockHouseholdId,
      });

      expect(mockHouseholdsService.addUserToHousehold).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
      );
      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).not.toHaveBeenCalled();
    });

    it('should trim name when creating new household', async () => {
      await (
        service as unknown as AuthServicePrivateTestAccess
      ).resolveAndAttachHousehold(mockUserId, {
        name: '  Trimmed Name  ',
      });

      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).toHaveBeenCalledWith(mockUserId, 'Trimmed Name', undefined);
    });

    it('should propagate NotFoundException when addUserToHousehold throws (invalid household id)', async () => {
      const notFound = new NotFoundException('Household not found');
      mockHouseholdsService.addUserToHousehold.mockRejectedValueOnce(notFound);

      await expect(
        (
          service as unknown as AuthServicePrivateTestAccess
        ).resolveAndAttachHousehold(mockUserId, {
          id: 'non-existent-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when household has neither name nor id', async () => {
      await expect(
        (
          service as unknown as AuthServicePrivateTestAccess
        ).resolveAndAttachHousehold(mockUserId, {
          name: '',
          id: '',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(
        mockHouseholdsService.createHouseholdForNewUser,
      ).not.toHaveBeenCalled();
      expect(mockHouseholdsService.addUserToHousehold).not.toHaveBeenCalled();
    });
  });
});
