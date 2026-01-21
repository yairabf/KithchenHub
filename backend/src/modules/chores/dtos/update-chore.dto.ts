import { IsString, IsOptional } from 'class-validator';

export class UpdateChoreDto {
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}
