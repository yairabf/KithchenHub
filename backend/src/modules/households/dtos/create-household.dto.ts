import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for creating a new household.
 */
export class CreateHouseholdDto {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(200, { message: 'Name must be at most 200 characters' })
  name: string;
}
