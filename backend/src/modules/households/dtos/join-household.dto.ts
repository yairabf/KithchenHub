import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for joining an existing household via invite code.
 */
export class JoinHouseholdDto {
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}
