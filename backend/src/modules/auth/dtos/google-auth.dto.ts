import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserCreationHouseholdDto } from './user-creation-household.dto';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserCreationHouseholdDto)
  household?: UserCreationHouseholdDto;
}
