import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(80)
  platform!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(80)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(160)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  expectedBehavior?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actualBehavior?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reproductionSteps?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  frequency?: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceContext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attachmentNote?: string;

  @IsBoolean()
  @Equals(true)
  privacyAcknowledged!: boolean;
}
