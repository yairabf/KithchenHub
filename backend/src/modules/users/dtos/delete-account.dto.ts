import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Optional body or query for account deletion (e.g. reason for deletion).
 */
export class DeleteAccountDto {
  @ApiPropertyOptional({
    description: 'Optional reason for account deletion',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
