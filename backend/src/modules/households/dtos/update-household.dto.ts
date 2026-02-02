import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Update payload for household settings. All fields are optional; only provided fields are updated.
 * When name is provided it must be non-empty after trim and at most 200 characters.
 */
export class UpdateHouseholdDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, {
    message: 'Household name must be non-empty when provided',
  })
  @MaxLength(200, {
    message: 'Household name must be at most 200 characters',
  })
  name?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
