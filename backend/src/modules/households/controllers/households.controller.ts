import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { HouseholdsService } from '../services/households.service';
import { UpdateHouseholdDto, InviteMemberDto } from '../dtos';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';

/**
 * Households controller managing household operations and member management.
 * All endpoints require authentication and household membership.
 */
@Controller('household')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class HouseholdsController {
  constructor(private householdsService: HouseholdsService) {}

  /**
   * Gets the current user's household with all members.
   */
  @Get()
  async getHousehold(@CurrentUser() user: CurrentUserPayload) {
    return this.householdsService.getHousehold(user.userId);
  }

  /**
   * Updates household settings (admin only).
   */
  @Put()
  async updateHousehold(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateHouseholdDto,
  ) {
    return this.householdsService.updateHousehold(user.userId, dto);
  }

  /**
   * Invites a new member to the household (admin only).
   */
  @Post('invite')
  async inviteMember(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: InviteMemberDto,
  ) {
    return this.householdsService.inviteMember(user.userId, dto);
  }

  /**
   * Removes a member from the household (admin only).
   */
  @Delete('members/:id')
  async removeMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
  ) {
    await this.householdsService.removeMember(user.userId, memberId);
    return { success: true };
  }
}
