export class RecentActivityDto {
  type: string;
  user: string;
  item: string;
  time: string;
}

export class DashboardSummaryDto {
  greeting: string;
  activeListCount: number;
  pendingChoresCount: number;
  savedRecipesCount: number;
  recentActivity: RecentActivityDto[];
}
