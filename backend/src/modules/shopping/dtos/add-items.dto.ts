import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ShoppingItemInputDto {
  @IsString()
  @IsOptional()
  masterItemId?: string;

  @IsString()
  @IsNotEmpty()
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

export class AddItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShoppingItemInputDto)
  items: ShoppingItemInputDto[];
}
