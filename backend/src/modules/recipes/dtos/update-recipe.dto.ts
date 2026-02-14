import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientInputDto, InstructionInputDto } from './create-recipe.dto';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  title?: string;

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
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IngredientInputDto)
  ingredients?: IngredientInputDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InstructionInputDto)
  instructions?: InstructionInputDto[];

  /** Optional URL; pass null to clear the recipe image. */
  @ValidateIf((o) => o.imageUrl != null)
  @IsString()
  @IsOptional()
  imageUrl?: string | null;
}
