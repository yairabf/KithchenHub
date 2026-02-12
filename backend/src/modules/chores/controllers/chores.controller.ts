import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ChoresService } from '../services/chores.service';
import { CreateChoreDto, UpdateChoreDto, ToggleCompletionDto } from '../dtos';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';

/**
 * Chores controller handling chore management and completion tracking.
 * API Version: 1
 * All endpoints require authentication and household membership.
 */
@Controller({ path: 'chores', version: '1' })
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ChoresController {
  constructor(private choresService: ChoresService) {}

  @Get()
  async getChores(
    @CurrentUser() user: CurrentUserPayload,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.choresService.getChores(user.householdId, { start, end });
  }

  @Post()
  async createChore(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateChoreDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.choresService.createChore(user.householdId, dto);
  }

  @Patch(':id')
  async updateChore(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') choreId: string,
    @Body() dto: UpdateChoreDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.choresService.updateChore(choreId, user.householdId, dto);
  }

  @Patch(':id/status')
  async toggleCompletion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') choreId: string,
    @Body() dto: ToggleCompletionDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.choresService.toggleCompletion(choreId, user.householdId, dto);
  }

  @Get('stats')
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('date') date?: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.choresService.getStats(user.householdId, date);
  }

  @Delete(':id')
  async deleteChore(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') choreId: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    await this.choresService.deleteChore(choreId, user.householdId);
    return { success: true };
  }

  @Post(':id/restore')
  async restoreChore(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') choreId: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    await this.choresService.restoreChore(choreId, user.householdId);
    return { success: true };
  }
}
