import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateIf,
  Min,
  ValidateNested,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType, UnitCode } from '../constants/units.constants';
import {
  IsValidUnitTypeMatch,
  HasPositiveAmountWhenMeasured,
  IngredientAmountRequiredForMeasuredConstraint,
  QuantityAmountNumericWhenPresentConstraint,
} from '../validators/unit-type-validator';

export class IngredientInputDto {
  @IsString()
  @IsNotEmpty()
  @Validate(IngredientAmountRequiredForMeasuredConstraint)
  @Validate(QuantityAmountNumericWhenPresentConstraint)
  name: string;

  @IsOptional()
  @IsNumber()
  @ValidateIf(
    (obj) =>
      obj.quantityUnitType === UnitType.WEIGHT ||
      obj.quantityUnitType === UnitType.VOLUME,
  )
  @Min(0.0001, {
    message: 'Amount must be a positive number for weight or volume units',
  })
  @ValidateIf(
    (obj) =>
      obj.quantityUnitType === UnitType.WEIGHT ||
      obj.quantityUnitType === UnitType.VOLUME,
  )
  @HasPositiveAmountWhenMeasured()
  quantityAmount?: number;

  @IsOptional()
  @IsEnum(UnitCode)
  @IsValidUnitTypeMatch()
  quantityUnit?: UnitCode;

  @IsEnum(UnitType)
  @IsOptional()
  quantityUnitType?: UnitType;

  @IsString()
  @IsOptional()
  quantityModifier?: string;

  /** @deprecated Use quantityAmount, quantityUnit, quantityUnitType instead */
  @IsNumber()
  @IsOptional()
  quantity?: number;

  /** @deprecated Use quantityUnit instead */
  @IsString()
  @IsOptional()
  unit?: string;
}

export class InstructionInputDto {
  @IsNumber()
  step: number;

  @IsString()
  @IsNotEmpty()
  instruction: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IngredientInputDto)
  ingredients: IngredientInputDto[];

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InstructionInputDto)
  instructions: InstructionInputDto[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
