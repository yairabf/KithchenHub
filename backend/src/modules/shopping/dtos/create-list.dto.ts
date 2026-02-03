import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
