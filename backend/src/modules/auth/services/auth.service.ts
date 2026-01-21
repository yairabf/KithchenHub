import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuthRepository } from '../repositories/auth.repository';
import { loadConfiguration } from '../../../config/configuration';
import { User, Household } from '@prisma/client';
import {
  GoogleAuthDto,
  GuestAuthDto,
  SyncDataDto,
  RefreshTokenDto,
  AuthResponseDto,
  UserResponseDto,
  SyncShoppingListDto,
  SyncRecipeDto,
  SyncChoreDto,
} from '../dtos';
import { JwtPayload, SyncConflict, SyncResult, UserWithHousehold } from '../types';
import { REFRESH_TOKEN_EXPIRY_DAYS, MAX_SYNC_ITEMS } from '../../../common/constants/token-expiry.constants';

/**
 * Authentication service handling user authentication, token management, and data synchronization.
 * 
 * Responsibilities:
 * - Google OAuth authentication
 * - Guest user authentication
 * - JWT token generation and refresh
 * - Offline data synchronization
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client | null = null;

  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    const config = loadConfiguration();
    if (config.google.clientId && config.google.clientSecret) {
      this.googleClient = new OAuth2Client(config.google.clientId);
    }
  }

  /**
   * Authenticates a user using Google OAuth ID token.
   * 
   * @param dto - Contains the Google ID token to verify
   * @returns Authentication response with access token, refresh token, and user info
   * @throws UnauthorizedException if token is invalid or Google OAuth is not configured
   * 
   * @example
   * ```typescript
   * const response = await authService.authenticateGoogle({ idToken: '...' });
   * ```
   */
  async authenticateGoogle(dto: GoogleAuthDto): Promise<AuthResponseDto> {
    if (!this.googleClient) {
      throw new UnauthorizedException('Google OAuth not configured');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const user = await this.findOrCreateGoogleUser(payload);

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.mapUserToResponse(user),
        householdId: user.householdId,
      };
    } catch (error) {
      this.logger.error('Google token verification failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Authenticates a guest user by device ID.
   * Creates a new guest user if one doesn't exist for the device.
   * 
   * @param dto - Contains the device ID
   * @returns Authentication response with access token and guest user info
   */
  async authenticateGuest(dto: GuestAuthDto): Promise<AuthResponseDto> {
    let user = await this.authRepository.findUserByDeviceId(dto.deviceId);

    if (!user) {
      user = await this.authRepository.createUser({
        deviceId: dto.deviceId,
        name: 'Guest',
        isGuest: true,
      });
    }

    const userWithHousehold = user as User & { household: Household | null };
    const tokens = await this.generateTokens(userWithHousehold);

    return {
      accessToken: tokens.accessToken,
      user: this.mapUserToResponse(userWithHousehold),
      householdId: null,
    };
  }

  /**
   * Synchronizes offline data to the cloud for a user.
   * Validates input size and structure before processing.
   * 
   * @param userId - The ID of the user performing the sync
   * @param syncData - The data to synchronize (lists, recipes, chores)
   * @returns Sync result with status and any conflicts encountered
   * @throws UnauthorizedException if user doesn't belong to a household
   * @throws BadRequestException if sync data exceeds size limits
   */
  async syncData(userId: string, syncData: SyncDataDto): Promise<SyncResult> {
    this.validateSyncDataSize(syncData);

    const user = await this.validateUserHasHousehold(userId);

    const conflicts: SyncConflict[] = [];

    if (syncData.lists) {
      const listConflicts = await this.syncShoppingLists(user.householdId!, syncData.lists);
      conflicts.push(...listConflicts);
    }

    if (syncData.recipes) {
      const recipeConflicts = await this.syncRecipes(user.householdId!, syncData.recipes);
      conflicts.push(...recipeConflicts);
    }

    if (syncData.chores) {
      const choreConflicts = await this.syncChores(user.householdId!, syncData.chores);
      conflicts.push(...choreConflicts);
    }

    const status = conflicts.length > 0 ? 'partial' : 'synced';
    return { status, conflicts };
  }

  /**
   * Refreshes an access token using a refresh token.
   * 
   * @param dto - Contains the refresh token
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const refreshTokenRecord = await this.authRepository.findRefreshToken(
      dto.refreshToken,
    );

    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: refreshTokenRecord.userId },
      include: { household: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = this.createJwtPayload(user);
    const config = loadConfiguration();
    
    const accessToken = await this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
      secret: config.jwt.secret,
      expiresIn: config.jwt.expiresIn,
    } as any);

    return { accessToken };
  }

  /**
   * Finds or creates a user based on Google OAuth payload.
   * Handles three scenarios:
   * 1. User exists with Google ID - update profile
   * 2. User exists with email but no Google ID - link Google account
   * 3. User doesn't exist - create new user
   */
  private async findOrCreateGoogleUser(payload: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  }): Promise<UserWithHousehold> {
    let user = await this.authRepository.findUserByGoogleId(payload.sub);

    if (!user) {
      user = await this.authRepository.findUserByEmail(payload.email!);
      if (user) {
        user = await this.authRepository.updateUser(user.id, {
          googleId: payload.sub,
          name: payload.name,
          avatarUrl: payload.picture,
          isGuest: false,
        });
      } else {
        user = await this.authRepository.createUser({
          email: payload.email,
          googleId: payload.sub,
          name: payload.name,
          avatarUrl: payload.picture,
          isGuest: false,
        });
      }
    } else {
      user = await this.authRepository.updateUser(user.id, {
        name: payload.name,
        avatarUrl: payload.picture,
        isGuest: false,
      });
    }

    return user as UserWithHousehold;
  }

  /**
   * Validates that sync data doesn't exceed size limits.
   */
  private validateSyncDataSize(syncData: SyncDataDto): void {
    const totalItems =
      (syncData.lists?.length || 0) +
      (syncData.recipes?.length || 0) +
      (syncData.chores?.length || 0);

    if (totalItems > MAX_SYNC_ITEMS) {
      throw new BadRequestException(
        `Sync data exceeds maximum of ${MAX_SYNC_ITEMS} items`,
      );
    }
  }

  /**
   * Validates that user exists and belongs to a household.
   */
  private async validateUserHasHousehold(userId: string): Promise<UserWithHousehold> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { household: true },
    });

    if (!user || !user.householdId) {
      throw new UnauthorizedException('User must belong to a household');
    }

    return user;
  }

  /**
   * Synchronizes shopping lists and their items.
   */
  private async syncShoppingLists(
    householdId: string,
    lists: SyncShoppingListDto[],
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    for (const list of lists) {
      try {
        await this.syncShoppingList(householdId, list);
      } catch (error) {
        conflicts.push({
          type: 'list',
          id: list.id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return conflicts;
  }

  /**
   * Synchronizes a single shopping list and its items.
   */
  private async syncShoppingList(
    householdId: string,
    list: SyncShoppingListDto,
  ): Promise<void> {
    await this.prisma.shoppingList.upsert({
      where: { id: list.id },
      create: {
        id: list.id,
        householdId,
        name: list.name,
        color: list.color,
      },
      update: {
        name: list.name,
        color: list.color,
      },
    });

    if (list.items) {
      await this.syncShoppingItems(list.id, list.items);
    }
  }

  /**
   * Synchronizes shopping items for a list.
   */
  private async syncShoppingItems(
    listId: string,
    items: SyncShoppingListDto['items'],
  ): Promise<void> {
    if (!items) return;

    for (const item of items) {
      await this.prisma.shoppingItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          listId,
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit,
          isChecked: item.isChecked || false,
          category: item.category,
        },
        update: {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          isChecked: item.isChecked,
          category: item.category,
        },
      });
    }
  }

  /**
   * Synchronizes recipes.
   */
  private async syncRecipes(
    householdId: string,
    recipes: SyncRecipeDto[],
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    for (const recipe of recipes) {
      try {
        await this.prisma.recipe.upsert({
          where: { id: recipe.id },
          create: {
            id: recipe.id,
            householdId,
            title: recipe.title,
            ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
            instructions: JSON.parse(JSON.stringify(recipe.instructions)),
          },
          update: {
            title: recipe.title,
            ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
            instructions: JSON.parse(JSON.stringify(recipe.instructions)),
          },
        });
      } catch (error) {
        conflicts.push({
          type: 'recipe',
          id: recipe.id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return conflicts;
  }

  /**
   * Synchronizes chores.
   */
  private async syncChores(
    householdId: string,
    chores: SyncChoreDto[],
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    for (const chore of chores) {
      try {
        await this.prisma.chore.upsert({
          where: { id: chore.id },
          create: {
            id: chore.id,
            householdId,
            title: chore.title,
            assigneeId: chore.assigneeId,
            dueDate: chore.dueDate ? new Date(chore.dueDate) : null,
            isCompleted: chore.isCompleted || false,
          },
          update: {
            title: chore.title,
            assigneeId: chore.assigneeId,
            dueDate: chore.dueDate ? new Date(chore.dueDate) : null,
            isCompleted: chore.isCompleted,
          },
        });
      } catch (error) {
        conflicts.push({
          type: 'chore',
          id: chore.id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return conflicts;
  }

  /**
   * Generates access and refresh tokens for a user.
   */
  private async generateTokens(user: User & { household: Household | null }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const config = loadConfiguration();
    const payload = this.createJwtPayload(user);

    const accessToken = await this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
      secret: config.jwt.secret,
      expiresIn: config.jwt.expiresIn,
    } as any);

    const refreshToken = await this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
      secret: config.jwt.refreshSecret,
      expiresIn: config.jwt.refreshExpiresIn,
    } as any);

    const expiresAt = this.calculateRefreshTokenExpiry();

    await this.authRepository.createRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Creates JWT payload from user entity.
   */
  private createJwtPayload(user: UserWithHousehold): JwtPayload {
    return {
      sub: user.id,
      email: user.email || undefined,
      householdId: user.householdId || null,
      isGuest: user.isGuest || false,
    };
  }

  /**
   * Calculates refresh token expiry date.
   */
  private calculateRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return expiresAt;
  }

  /**
   * Maps user entity to response DTO.
   */
  private mapUserToResponse(user: User & { household: Household | null }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      householdId: user.householdId,
    };
  }
}
