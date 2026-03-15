import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUserPayload } from '../../../common/decorators';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { ShoppingService } from '../services/shopping.service';
import { ShoppingListsController } from './shopping.controller';

describe('ShoppingListsController', () => {
  let controller: ShoppingListsController;

  const mockShoppingService = {
    getShoppingData: jest.fn(),
  };

  const mockUser: CurrentUserPayload = {
    userId: 'user-123',
    householdId: 'household-123',
    email: 'test@example.com',
  };

  const aggregateFixture = {
    lists: [
      {
        id: 'list-1',
        name: 'Main List',
        isMain: true,
        itemCount: 2,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ],
    items: [
      {
        listId: 'list-1',
        id: 'item-1',
        name: 'Milk',
        quantity: 1,
        isChecked: false,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingListsController],
      providers: [
        {
          provide: ShoppingService,
          useValue: mockShoppingService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(HouseholdGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ShoppingListsController>(ShoppingListsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getShoppingData', () => {
    describe('when user has no household', () => {
      it('throws BadRequestException and does not call service', async () => {
        await expect(
          controller.getShoppingData({ ...mockUser, householdId: undefined }),
        ).rejects.toThrow(BadRequestException);

        expect(mockShoppingService.getShoppingData).not.toHaveBeenCalled();
      });
    });

    describe.each([
      ['en', 'en'],
      ['he', 'he'],
      ['undefined (no lang param)', undefined],
      ['empty string', ''],
    ])('with lang=%s', (_description, lang) => {
      it('delegates to ShoppingService with correct householdId and lang', async () => {
        mockShoppingService.getShoppingData.mockResolvedValue(aggregateFixture);

        await controller.getShoppingData(mockUser, lang);

        expect(mockShoppingService.getShoppingData).toHaveBeenCalledWith(
          mockUser.householdId,
          lang,
        );
      });

      it('returns the ShoppingDataDto from the service', async () => {
        mockShoppingService.getShoppingData.mockResolvedValue(aggregateFixture);

        const result = await controller.getShoppingData(mockUser, lang);

        expect(result).toEqual(aggregateFixture);
      });
    });

    describe('when service throws', () => {
      it('propagates generic errors to the caller', async () => {
        const serviceError = new Error('Database unavailable');
        mockShoppingService.getShoppingData.mockRejectedValue(serviceError);

        await expect(
          controller.getShoppingData(mockUser, 'en'),
        ).rejects.toThrow('Database unavailable');
      });
    });
  });
});
