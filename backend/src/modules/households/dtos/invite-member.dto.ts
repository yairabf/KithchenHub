import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
