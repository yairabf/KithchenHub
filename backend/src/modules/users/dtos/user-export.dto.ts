import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User summary in data export (no sensitive fields).
 */
export class UserExportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  createdAt: Date;
}

/**
 * Household summary in data export.
 */
export class HouseholdExportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  joinedAt: Date;
}

/**
 * Activity summary for export.
 */
export class ActivityExportSummaryDto {
  @ApiProperty()
  totalRecipesCreated: number;

  @ApiProperty()
  totalListsCreated: number;

  @ApiProperty()
  totalChoresCompleted: number;

  @ApiProperty()
  lastActive: Date;
}

/**
 * Full data export response for GDPR data portability.
 */
export class UserExportDto {
  @ApiProperty({ type: UserExportSummaryDto })
  user: UserExportSummaryDto;

  @ApiPropertyOptional({ type: HouseholdExportSummaryDto, nullable: true })
  household: HouseholdExportSummaryDto | null;

  @ApiProperty({ type: [Object], description: 'Recipes in the household' })
  recipes: Record<string, unknown>[];

  @ApiProperty({ type: [Object], description: 'Shopping lists with items' })
  shoppingLists: Record<string, unknown>[];

  @ApiProperty({ type: [Object], description: 'Chores assigned to the user' })
  assignedChores: Record<string, unknown>[];

  @ApiProperty({ type: ActivityExportSummaryDto })
  activity: ActivityExportSummaryDto;

  @ApiProperty({ description: 'Export timestamp' })
  exportedAt: Date;
}
