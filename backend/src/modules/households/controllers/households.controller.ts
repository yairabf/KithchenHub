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
 * API Version: 1
 * All endpoints require authentication and household membership.
 */
@Controller({ path: 'household', version: '1' })
export class HouseholdsController {
  constructor(private householdsService: HouseholdsService) { }

  /**
   * Creates a new household for the user.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createHousehold(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateHouseholdDto,
  ) {
    const trimmedName = typeof dto.name === 'string' ? dto.name.trim() : '';
    if (!trimmedName) {
      throw new BadRequestException('Name is required');
    }
    return this.householdsService.createHousehold(user.userId, trimmedName);
  }

  /**
   * Gets the current user's household with all members.
   */
  @Get()
  @UseGuards(JwtAuthGuard, HouseholdGuard)
  async getHousehold(@CurrentUser() user: CurrentUserPayload) {
    return this.householdsService.getHousehold(user.userId);
  }

  /**
   * Updates household settings (admin only).
   */
  @Put()
  @UseGuards(JwtAuthGuard, HouseholdGuard)
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
  @UseGuards(JwtAuthGuard, HouseholdGuard)
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
  @UseGuards(JwtAuthGuard, HouseholdGuard)
  async removeMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
  ) {
    await this.householdsService.removeMember(user.userId, memberId);
    return { success: true };
  }
}
