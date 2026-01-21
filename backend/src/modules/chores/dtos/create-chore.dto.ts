import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateChoreDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  repeat?: string;
}
