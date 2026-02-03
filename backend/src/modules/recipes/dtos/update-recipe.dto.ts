import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientInputDto, InstructionInputDto } from './create-recipe.dto';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @IsNumber()
  @IsOptional()
  cookTime?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IngredientInputDto)
  ingredients?: IngredientInputDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InstructionInputDto)
  instructions?: InstructionInputDto[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
