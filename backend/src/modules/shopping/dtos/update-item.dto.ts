import { IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateItemDto {
  @IsBoolean()
  @IsOptional()
  isChecked?: boolean;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}
