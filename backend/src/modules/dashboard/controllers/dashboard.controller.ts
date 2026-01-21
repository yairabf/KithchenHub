import { Controller, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: CurrentUserPayload) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.dashboardService.getSummary(user.userId, user.householdId);
  }
}
