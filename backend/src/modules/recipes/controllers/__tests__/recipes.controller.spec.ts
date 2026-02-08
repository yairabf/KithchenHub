import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from '../recipes.controller';
import { RecipesService } from '../../services/recipes.service';
import { CreateRecipeDto } from '../../dtos/create-recipe.dto';
import { RecipeDetailDto } from '../../dtos/recipe-detail-response.dto';
import { UnitCode, UnitType } from '../../constants/units.constants';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../../../common/guards/household.guard';
import { CurrentUserPayload } from '../../../../common/decorators/current-user.decorator';

describe('RecipesController - Unit System', () => {
  let controller: RecipesController;
  let service: RecipesService;

  const mockUser: CurrentUserPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    householdId: 'household-1',
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: RecipesService,
          useValue: {
            createRecipe: jest.fn(),
            getRecipe: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(HouseholdGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get<RecipesController>(RecipesController);
    service = moduleRef.get<RecipesService>(RecipesService);
  });

  describe('createRecipe', () => {
    it('should accept new ingredient format with quantityAmount, quantityUnit, quantityUnitType', async () => {
      const dto: CreateRecipeDto = {
        title: 'Test Recipe',
        ingredients: [
          {
            name: 'Flour',
            quantityAmount: 500,
            quantityUnit: UnitCode.GRAM,
            quantityUnitType: UnitType.WEIGHT,
          },
        ],
        instructions: [{ step: 1, instruction: 'Mix' }],
      };

      const created: RecipeDetailDto = {
        id: 'recipe-123',
        title: dto.title,
        ingredients: dto.ingredients as RecipeDetailDto['ingredients'],
        instructions: dto.instructions,
        hasImage: false,
      };

      jest.spyOn(service, 'createRecipe').mockResolvedValue(created);

      const result = await controller.createRecipe(mockUser, dto);

      expect(service.createRecipe).toHaveBeenCalledWith(
        mockUser.householdId,
        dto,
      );
      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0]).toMatchObject({
        name: 'Flour',
        quantityAmount: 500,
        quantityUnit: UnitCode.GRAM,
        quantityUnitType: UnitType.WEIGHT,
      });
    });
  });

  describe('getRecipe', () => {
    it('should return recipe with new ingredient shape (quantityAmount, quantityUnit, quantityUnitType)', async () => {
      const mockRecipe: RecipeDetailDto = {
        id: '123',
        title: 'Test',
        ingredients: [
          {
            name: 'Flour',
            quantityAmount: 500,
            quantityUnit: UnitCode.GRAM,
            quantityUnitType: UnitType.WEIGHT,
          },
        ],
        instructions: [{ step: 1, instruction: 'Mix' }],
        hasImage: false,
      };

      jest.spyOn(service, 'getRecipe').mockResolvedValue(mockRecipe);

      const result = await controller.getRecipe(mockUser, '123');

      expect(result.ingredients[0]).toHaveProperty('quantityAmount', 500);
      expect(result.ingredients[0]).toHaveProperty(
        'quantityUnit',
        UnitCode.GRAM,
      );
      expect(result.ingredients[0]).toHaveProperty(
        'quantityUnitType',
        UnitType.WEIGHT,
      );
    });
  });
});
