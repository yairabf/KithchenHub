import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleCompletionDto {
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}
