import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { GoogleAuthDto, SyncDataDto, RefreshTokenDto } from '../dtos';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Authentication controller handling user authentication and data synchronization.
 *
 * API Version: 1
 *
 * Public endpoints:
 * - POST /auth/google - Google OAuth authentication
 * - POST /auth/refresh - Token refresh
 *
 * Protected endpoints:
 * - GET /auth/me - Get current user information
 * - POST /auth/sync - Offline data synchronization
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Authenticates a user using Google OAuth ID token.
   *
   * @param dto - Contains Google ID token
   * @returns Authentication response with tokens and user info
   */
  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  async authenticateGoogle(@Body() dto: GoogleAuthDto) {
    return this.authService.authenticateGoogle(dto);
  }

  /**
   * Synchronizes offline data to the cloud.
   * Requires authentication.
   *
   * @param user - Current authenticated user
   * @param dto - Data to synchronize (lists, recipes, chores)
   * @returns Sync result with status and conflicts
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncData(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SyncDataDto,
  ) {
    return this.authService.syncData(user.userId, dto);
  }

  /**
   * Refreshes an access token using a refresh token.
   *
   * @param dto - Contains refresh token
   * @returns New access token
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  /**
   * Gets the current authenticated user's information.
   *
   * Used by mobile app after OAuth callback to retrieve full user object
   * without embedding sensitive data in the callback URL.
   *
   * @param user - Current authenticated user from JWT
   * @returns User information with household data
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns authenticated user information',
  })
  async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getCurrentUser(user.userId);
  }
}
