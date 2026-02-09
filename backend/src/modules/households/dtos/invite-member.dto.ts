import { IsString, IsEmail, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;
}
