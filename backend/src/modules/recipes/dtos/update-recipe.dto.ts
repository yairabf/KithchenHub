import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @IsArray()
  @IsOptional()
  ingredients?: any[];

  @IsArray()
  @IsOptional()
  instructions?: any[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
