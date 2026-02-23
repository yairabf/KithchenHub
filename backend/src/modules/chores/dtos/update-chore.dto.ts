import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateChoreDto {
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}
