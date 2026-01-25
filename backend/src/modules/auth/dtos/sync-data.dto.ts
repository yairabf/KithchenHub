import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncShoppingItemDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isChecked?: boolean;
}

export class SyncShoppingListDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncShoppingItemDto)
  items?: SyncShoppingItemDto[];
}

export class SyncRecipeIngredientDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class SyncRecipeInstructionDto {
  @IsNumber()
  step: number;

  @IsString()
  instruction: string;
}

export class SyncRecipeDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRecipeIngredientDto)
  ingredients: SyncRecipeIngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRecipeInstructionDto)
  instructions: SyncRecipeInstructionDto[];
}

export class SyncChoreDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}

export class SyncDataDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncShoppingListDto)
  lists?: SyncShoppingListDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncRecipeDto)
  recipes?: SyncRecipeDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncChoreDto)
  chores?: SyncChoreDto[];
}
