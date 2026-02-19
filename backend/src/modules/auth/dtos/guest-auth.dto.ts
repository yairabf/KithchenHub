import { IsString, IsNotEmpty } from 'class-validator';

export class GuestAuthDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
