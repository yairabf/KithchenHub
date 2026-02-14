import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { DeleteAccountDto } from '../dtos/delete-account.dto';
import { UserExportDto } from '../dtos/user-export.dto';

/**
 * User profile and account management.
 * API Version: 1
 *
 * Protected endpoints:
 * - DELETE /users/me - Delete account and data
 * - GET /users/me/export - Export user data (GDPR)
 */
@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  /**
   * Deletes the current user's account and associated data.
   * Optional reason can be provided via query parameter or request body; query takes precedence.
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete account',
    description:
      'Permanently deletes the current user account and associated data. If sole household admin, deletes the household and all its data. Revokes all refresh tokens. Optional reason via query param or body (query takes precedence).',
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Reason for deletion (overrides body if both provided)',
  })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Query('reason') queryReason?: string,
    @Body() dto?: DeleteAccountDto,
  ): Promise<void> {
    const bodyReason = dto?.reason;
    const deletionReason = queryReason ?? bodyReason;

    if (
      queryReason != null &&
      bodyReason != null &&
      queryReason.trim() !== bodyReason.trim()
    ) {
      this.logger.warn(
        'Deletion reason provided in both query and body; using query',
        {
          userId: user.userId,
          queryReason,
          bodyReason,
        },
      );
    }

    await this.usersService.deleteAccount(user.userId, deletionReason);
  }

  /**
   * Exports all user data for GDPR data portability.
   */
  @Get('me/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export user data',
    description:
      'Returns all user data (profile, household, recipes, shopping lists, chores) in JSON format for data portability (GDPR).',
  })
  @ApiResponse({
    status: 200,
    description: 'User data export',
    type: UserExportDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportData(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserExportDto> {
    return this.usersService.exportUserData(user.userId);
  }
}
