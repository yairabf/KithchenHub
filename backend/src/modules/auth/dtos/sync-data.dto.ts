import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncShoppingItemDto {
  @IsString()
  id: string;

  @IsUUID(4)
  operationId: string; // Idempotency key for this operation (UUID v4)

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

  @IsUUID(4)
  operationId: string; // Idempotency key for this operation (UUID v4)

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

  @IsUUID(4)
  operationId: string; // Idempotency key for this operation (UUID v4)

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

  @IsUUID(4)
  operationId: string; // Idempotency key for this operation (UUID v4)

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
  @IsUUID(4)
  @IsOptional()
  requestId?: string; // Optional request ID for observability (same for all items in batch, UUID v4)

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
