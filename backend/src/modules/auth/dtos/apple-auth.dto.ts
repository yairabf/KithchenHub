import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserCreationHouseholdDto } from './user-creation-household.dto';

export class AppleAuthDto {
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserCreationHouseholdDto)
  household?: UserCreationHouseholdDto;
}
