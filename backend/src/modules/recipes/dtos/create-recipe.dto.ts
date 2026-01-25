import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';

export class IngredientInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

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

  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @IsArray()
  @IsNotEmpty()
  ingredients: IngredientInputDto[];

  @IsArray()
  @IsNotEmpty()
  instructions: InstructionInputDto[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
