import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import {
  GoogleAuthDto,
  AppleAuthDto,
  SyncDataDto,
  RefreshTokenDto,
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from '../dtos';
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
 * - POST /auth/apple - Sign in with Apple authentication
 * - POST /auth/register - Email/password registration
 * - POST /auth/login - Email/password login
 * - POST /auth/verify-email - Verify email address
 * - POST /auth/resend-verification - Resend verification email
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
   * Authenticates a user using a Sign in with Apple identity token.
   *
   * @param dto - Contains Apple identity token and one-time profile fields
   * @returns Authentication response with tokens and user info
   */
  @Post('apple')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with Sign in with Apple',
    description:
      'Verifies the Apple identity token and creates or links a user account.',
  })
  async authenticateApple(@Body() dto: AppleAuthDto) {
    return this.authService.authenticateApple(dto);
  }

  /**
   * Registers a new user with email and password.
   *
   * @param dto - Registration data (email, password, optional name and household)
   * @returns Success message (user must verify email before login)
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Creates a new user account. Email verification required before login.',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param dto - Login credentials (email and password)
   * @returns Authentication response with tokens and user info
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates user with email and password. Email must be verified.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Verifies a user's email address using the verification token (GET endpoint for email links).
   *
   * @param token - Verification token from query parameter
   * @returns Authentication response with tokens (auto-login after verification)
   */
  @Get('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address (GET)',
    description:
      'Verifies user email via GET request (for email links) and automatically logs them in.',
  })
  async verifyEmailGet(
    @Query('token') token: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    await this.authService.verifyEmail({ token });

    reply.type('text/html; charset=utf-8').send(this.buildEmailVerifiedHtml());
  }

  /**
   * Verifies a user's email address using the verification token (POST endpoint for API calls).
   *
   * @param dto - Contains the verification token
   * @returns Authentication response with tokens (auto-login after verification)
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address (POST)',
    description:
      'Verifies user email via POST request and automatically logs them in.',
  })
  async verifyEmailPost(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  /**
   * Resends email verification email to the user.
   *
   * @param dto - Contains the user's email
   * @returns Success message
   */
  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Sends a new email verification link to the user.',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
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

  private buildEmailVerifiedHtml(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Email was verified</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f6f7fb;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(420px, calc(100% - 32px));
      padding: 32px 24px;
      border-radius: 24px;
      background: #ffffff;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
      text-align: center;
    }
    .check {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: #ecfdf5;
      color: #059669;
      font-size: 36px;
      line-height: 1;
    }
    h1 { margin: 0 0 12px; font-size: 28px; }
    p { margin: 0; color: #6b7280; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <div class="check" aria-hidden="true">✓</div>
    <h1>Email was verified</h1>
    <p>Your KitchenHub account is ready. You can close this page and return to the app.</p>
  </main>
</body>
</html>`;
  }
}
