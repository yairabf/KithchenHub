import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShoppingItemInputDto {
  @IsString()
  @IsOptional()
  catalogItemId?: string;

  @IsString()
  @IsOptional()
  masterItemId?: string;

  @ValidateIf((item) => !item.catalogItemId && !item.masterItemId)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  image?: string;

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
