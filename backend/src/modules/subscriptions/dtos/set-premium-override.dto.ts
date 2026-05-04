import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SetPremiumOverrideDto {
  @IsBoolean()
  isPremium!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
