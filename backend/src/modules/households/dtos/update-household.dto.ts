import { IsString, IsOptional } from 'class-validator';

export class UpdateHouseholdDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
