export class ChoreDto {
  id: string;
  title: string;
  icon?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  repeat?: string;
}

export class ChoreListResponseDto {
  today: ChoreDto[];
  upcoming: ChoreDto[];
}
