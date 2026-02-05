import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IngredientInputDto } from '../create-recipe.dto';
import { UnitCode, UnitType } from '../../constants/units.constants';

describe('IngredientInputDto Validation', () => {
  describe.each<[string, Record<string, unknown>, boolean]>([
    [
      'valid weight unit',
      {
        name: 'Flour',
        quantityAmount: 500,
        quantityUnit: UnitCode.GRAM,
        quantityUnitType: UnitType.WEIGHT,
      },
      true,
    ],
    [
      'valid volume unit',
      {
        name: 'Milk',
        quantityAmount: 250,
        quantityUnit: UnitCode.MILLILITER,
        quantityUnitType: UnitType.VOLUME,
      },
      true,
    ],
    [
      'valid count unit',
      {
        name: 'Eggs',
        quantityAmount: 2,
        quantityUnit: UnitCode.PIECE,
        quantityUnitType: UnitType.COUNT,
      },
      true,
    ],
    [
      'mismatched unit type - weight unit with volume type',
      {
        name: 'Test',
        quantityAmount: 100,
        quantityUnit: UnitCode.GRAM,
        quantityUnitType: UnitType.VOLUME,
      },
      false,
    ],
    [
      'mismatched unit type - volume unit with weight type',
      {
        name: 'Test',
        quantityAmount: 100,
        quantityUnit: UnitCode.CUP,
        quantityUnitType: UnitType.WEIGHT,
      },
      false,
    ],
    ['optional fields omitted', { name: 'Salt' }, true],
    [
      'negative amount for weight',
      {
        name: 'Sugar',
        quantityAmount: -10,
        quantityUnit: UnitCode.GRAM,
        quantityUnitType: UnitType.WEIGHT,
      },
      false,
    ],
    [
      'decimal amount',
      {
        name: 'Butter',
        quantityAmount: 0.5,
        quantityUnit: UnitCode.CUP,
        quantityUnitType: UnitType.VOLUME,
      },
      true,
    ],
    [
      'weight without positive amount fails',
      {
        name: 'Flour',
        quantityUnit: UnitCode.GRAM,
        quantityUnitType: UnitType.WEIGHT,
      },
      false,
    ],
    [
      'non-numeric quantityAmount with count unit type fails',
      {
        name: 'Eggs',
        quantityAmount: 'two',
        quantityUnit: UnitCode.PIECE,
        quantityUnitType: UnitType.COUNT,
      },
      false,
    ],
    [
      'non-numeric quantityAmount with omitted unit type fails',
      {
        name: 'Salt',
        quantityAmount: 'pinch',
      },
      false,
    ],
    [
      'invalid quantityUnit when unit type omitted fails',
      {
        name: 'Herbs',
        quantityAmount: 1,
        quantityUnit: 'handful',
      },
      false,
    ],
  ])('%s', (_, input, shouldBeValid) => {
    it(`should ${shouldBeValid ? 'pass' : 'fail'} validation`, async () => {
      const dto = plainToInstance(IngredientInputDto, input);
      const errors = await validate(dto);

      if (shouldBeValid) {
        expect(errors).toHaveLength(0);
      } else {
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });
});
