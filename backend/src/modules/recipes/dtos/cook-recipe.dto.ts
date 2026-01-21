import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CookRecipeDto {
  @IsString()
  @IsNotEmpty()
  targetListId: string;

  @IsString()
  @IsOptional()
  ingredients?: string; // JSON string of ingredients to add
}
