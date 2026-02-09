import {
  HttpException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuthRepository } from '../repositories/auth.repository';
import { HouseholdsService } from '../../households/services/households.service';
import { UuidService } from '../../../common/services/uuid.service';
import { EmailService } from './email.service';
import { loadConfiguration } from '../../../config/configuration';
import { User, Household } from '@prisma/client';
import {
  GoogleAuthDto,
  SyncDataDto,
  RefreshTokenDto,
  AuthResponseDto,
  UserResponseDto,
  SyncShoppingListDto,
  SyncRecipeDto,
  SyncChoreDto,
  UserCreationHouseholdDto,
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from '../dtos';
import {
  JwtPayload,
  SyncConflict,
  SyncResult,
  UserWithHousehold,
} from '../types';
import {
  REFRESH_TOKEN_EXPIRY_DAYS,
  MAX_SYNC_ITEMS,
} from '../../../common/constants/token-expiry.constants';

import {
  SYNC_ENTITY_TYPES,
  type SyncEntityType,
} from '../constants/sync-entity-types';

/**
 * Type guard for Prisma unique constraint violation errors
 * @param error - The error to check
 * @returns True if error is a Prisma unique constraint violation
 */
function isPrismaUniqueConstraintError(error: unknown): error is {
  code: string;
  meta?: {
    target?: string[];
  };
} {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

/**
 * Authentication service handling user authentication, token management, and data synchronization.
 *
 * Responsibilities:
 * - Google OAuth authentication
 * - Email/password authentication
 * - JWT token generation and refresh
 * - Offline data synchronization
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client | null = null;
  private readonly config = loadConfiguration();

  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private uuidService: UuidService,
    private householdsService: HouseholdsService,
    private emailService: EmailService,
  ) {
    const config = loadConfiguration();
    if (config.google.clientId && config.google.clientSecret) {
      this.googleClient = new OAuth2Client(
        config.google.clientId,
        config.google.clientSecret,
      );
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

      const { user: userResult, isNewUser } =
        await this.findOrCreateGoogleUser(payload);
      let user = userResult;
      let isNewHousehold = false;

      if (user.householdId) {
        if (dto.household) {
          throw new BadRequestException(
            'Cannot attach or switch household during login.',
          );
        }
      } else {
        if (dto.household) {
          await this.resolveAndAttachHousehold(user.id, dto.household);
          isNewHousehold = dto.household.name !== undefined;
        } else {
          const defaultName = this.deriveDefaultHouseholdName(
            payload.email ?? '',
            payload.name,
          );
          await this.resolveAndAttachHousehold(user.id, {
            name: defaultName,
          });
          isNewHousehold = true;
        }
        const refreshed = await this.authRepository.findUserById(user.id);
        user = (refreshed ?? user) as UserWithHousehold;
      }

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.mapUserToResponse(user),
        householdId: user.householdId,
        isNewUser,
        isNewHousehold,
        household: user.household
          ? {
              id: user.household.id,
              name: user.household.name,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Google token verification failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Authenticates a user using Google OAuth authorization code.
   *
   * This method implements the backend-driven OAuth flow where the backend
   * exchanges the authorization code for tokens directly with Google.
   *
   * @param code - Authorization code from Google OAuth callback
   * @param redirectUri - The redirect URI used in the OAuth flow (must match Google Cloud Console)
   * @param metadata - Optional metadata from state token (e.g., householdId for join flow)
   * @returns Authentication response with access token, refresh token, and user info
   * @throws UnauthorizedException if code exchange fails or Google OAuth is not configured
   *
   * @example
   * ```typescript
   * const response = await authService.authenticateGoogleWithCode(
   *   'auth-code-from-google',
   *   'http://localhost:3000/api/v1/auth/google/callback',
   *   { householdId: 'abc-123' }
   * );
   * ```
   */
  async authenticateGoogleWithCode(
    code: string,
    redirectUri: string,
    metadata?: { householdId?: string },
  ): Promise<AuthResponseDto> {
    if (!this.googleClient) {
      throw new UnauthorizedException('Google OAuth not configured');
    }

    try {
      // Exchange authorization code for tokens
      // Note: OAuth2Client.getToken() returns a Promise<GetTokenResponse>
      // which contains { tokens: Credentials }
      // IMPORTANT: Must pass the same redirect_uri that was used in the authorization request
      const tokenResponse = await this.googleClient.getToken({
        code,
        redirect_uri: redirectUri,
      });
      const tokens = tokenResponse.tokens;

      if (!tokens.id_token) {
        this.logger.error('Google token exchange failed: no id_token received');
        throw new UnauthorizedException('Failed to get Google ID token');
      }

      // Verify the ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      // Find or create user based on Google payload
      const { user: userResult, isNewUser } =
        await this.findOrCreateGoogleUser(payload);
      let user = userResult;
      let isNewHousehold = false;

      // Handle household attachment logic
      if (user.householdId) {
        // User already has a household
        if (metadata?.householdId) {
          throw new BadRequestException(
            'Cannot attach or switch household during login.',
          );
        }
      } else {
        // User doesn't have a household - create or join one
        if (metadata?.householdId) {
          // Join existing household (not a new household)
          await this.resolveAndAttachHousehold(user.id, {
            id: metadata.householdId,
          });
          isNewHousehold = false;
        } else {
          // Create new household with default name
          const defaultName = this.deriveDefaultHouseholdName(
            payload.email ?? '',
            payload.name,
          );
          await this.resolveAndAttachHousehold(user.id, {
            name: defaultName,
          });
          isNewHousehold = true;
        }
        // Refresh user data to get household info
        const refreshed = await this.authRepository.findUserById(user.id);
        user = (refreshed ?? user) as UserWithHousehold;
      }

      // Generate JWT tokens
      const jwtTokens = await this.generateTokens(user);

      this.logger.log(
        `Google OAuth code exchange success for user: ${user.id}${metadata?.householdId ? ` (joined household: ${metadata.householdId})` : ''}`,
      );

      return {
        accessToken: jwtTokens.accessToken,
        refreshToken: jwtTokens.refreshToken,
        user: this.mapUserToResponse(user),
        householdId: user.householdId,
        isNewUser,
        isNewHousehold,
        household: user.household
          ? {
              id: user.household.id,
              name: user.household.name,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Google code exchange failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException(
        'Failed to exchange Google authorization code',
      );
    }
  }

  /**
   * Synchronizes offline data to the cloud for a user.
   * Validates input size and structure before processing.
   *
   * **Conflict Resolution Strategy:**
   * - Backend uses simple `upsert` operations (no timestamp-based conflict resolution)
   * - All conflict resolution is handled client-side using Last-Write-Wins (LWW) strategy
   * - Server timestamps are authoritative (Prisma auto-manages `updatedAt` via `@updatedAt` directive)
   * - `deletedAt` is handled via soft-delete in repositories
   * - Client-side conflict resolution ensures deterministic outcomes for offline-first architecture
   *
   * **Why Client-Side Resolution:**
   * - Prevents conflict resolution loops between client and server
   * - Allows offline-first architecture with local conflict resolution
   * - Server remains simple (just upsert) while client handles all conflicts
   * - Server timestamps are still authoritative (Prisma auto-manages them)
   *
   * @param userId - The ID of the user performing the sync
   * @param syncData - The data to synchronize (lists, recipes, chores)
   * @returns Sync result with status and any conflicts encountered
   * @throws UnauthorizedException if user doesn't belong to a household
   * @throws BadRequestException if sync data exceeds size limits
   */
  async syncData(userId: string, syncData: SyncDataDto): Promise<SyncResult> {
    const listCount = syncData.lists?.length ?? 0;
    const recipeCount = syncData.recipes?.length ?? 0;
    const choreCount = syncData.chores?.length ?? 0;
    const listItemCount =
      syncData.lists?.reduce(
        (sum, list) => sum + (list.items?.length ?? 0),
        0,
      ) ?? 0;
    this.logger.log(
      `sync: lists=${listCount} recipes=${recipeCount} chores=${choreCount} listItems=${listItemCount} requestId=${syncData.requestId ?? 'none'}`,
    );

    this.validateSyncDataSize(syncData);

    const user = await this.validateUserHasHousehold(userId);

    const allSucceeded: Array<{
      operationId: string;
      entityType: 'list' | 'recipe' | 'chore';
      id: string;
      clientLocalId?: string;
    }> = [];
    const allConflicts: SyncConflict[] = [];

    // Collect all incoming operationIds for invariant checking
    // Also build mapping for better debugging context
    const incomingOperationIds = new Set<string>();
    const operationIdToEntity = new Map<string, { type: string; id: string }>();

    if (syncData.lists) {
      for (const list of syncData.lists) {
        incomingOperationIds.add(list.operationId);
        operationIdToEntity.set(list.operationId, {
          type: 'list',
          id: list.id,
        });
        if (list.items) {
          for (const item of list.items) {
            incomingOperationIds.add(item.operationId);
            operationIdToEntity.set(item.operationId, {
              type: 'shoppingItem',
              id: item.id,
            });
          }
        }
      }
      const listResults = await this.syncShoppingLists(
        userId,
        user.householdId!,
        syncData.lists,
        syncData.requestId,
      );
      allSucceeded.push(
        ...listResults.succeeded.map((s) => ({
          ...s,
          entityType: 'list' as const,
        })),
      );
      allConflicts.push(...listResults.conflicts);
    }

    if (syncData.recipes) {
      for (const recipe of syncData.recipes) {
        incomingOperationIds.add(recipe.operationId);
        operationIdToEntity.set(recipe.operationId, {
          type: 'recipe',
          id: recipe.id,
        });
      }
      const recipeResults = await this.syncRecipes(
        userId,
        user.householdId!,
        syncData.recipes,
        syncData.requestId,
      );
      allSucceeded.push(
        ...recipeResults.succeeded.map((s) => ({
          ...s,
          entityType: 'recipe' as const,
        })),
      );
      allConflicts.push(...recipeResults.conflicts);
    }

    if (syncData.chores) {
      for (const chore of syncData.chores) {
        incomingOperationIds.add(chore.operationId);
        operationIdToEntity.set(chore.operationId, {
          type: 'chore',
          id: chore.id,
        });
      }
      const choreResults = await this.syncChores(
        userId,
        user.householdId!,
        syncData.chores,
        syncData.requestId,
      );
      allSucceeded.push(
        ...choreResults.succeeded.map((s) => ({
          ...s,
          entityType: 'chore' as const,
        })),
      );
      allConflicts.push(...choreResults.conflicts);
    }

    // Enforce invariant: every operationId must appear exactly once
    const seenOperationIds = new Set([
      ...allSucceeded.map((s) => s.operationId),
      ...allConflicts.map((c) => c.operationId),
    ]);

    if (seenOperationIds.size !== incomingOperationIds.size) {
      const missing = Array.from(incomingOperationIds).filter(
        (id) => !seenOperationIds.has(id),
      );
      const missingWithContext = missing.map((opId) => ({
        operationId: opId,
        ...(operationIdToEntity.get(opId) || {
          type: 'unknown',
          id: 'unknown',
        }),
      }));
      this.logger.error(
        'Sync result invariant violated: missing operationIds',
        {
          userId,
          requestId: syncData.requestId,
          missingOperationIds: missingWithContext,
          expectedCount: incomingOperationIds.size,
          actualCount: seenOperationIds.size,
        },
      );
      // Don't throw - log error but continue (better than breaking sync)
    }

    const status =
      allConflicts.length > 0
        ? allSucceeded.length > 0
          ? 'partial'
          : 'failed'
        : 'synced';

    return {
      status,
      conflicts: allConflicts,
      succeeded: allSucceeded.length > 0 ? allSucceeded : undefined,
    };
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

    const accessToken = await this.jwtService.signAsync(
      payload as unknown as Record<string, unknown>,
      {
        secret: config.jwt.secret,
        expiresIn: config.jwt.expiresIn,
      } as any,
    );

    return { accessToken };
  }

  /**
   * Gets the current authenticated user's information.
   *
   * Used by mobile app after OAuth callback to retrieve full user object
   * without embedding sensitive data in the callback URL.
   *
   * @param userId - User ID from JWT payload
   * @returns User response DTO with household information
   * @throws UnauthorizedException if user not found
   *
   * @example
   * ```typescript
   * const user = await authService.getCurrentUser('user-id-from-jwt');
   * ```
   */
  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { household: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToResponse(user as UserWithHousehold);
  }

  /**
   * Finds or creates a user based on Google OAuth payload.
   * Handles three scenarios:
   * 1. User exists with Google ID - update profile
   * 2. User exists with email but no Google ID - link Google account
   * 3. User doesn't exist - create new user
   *
   * @returns Object containing the user and isNewUser flag
   */
  private async findOrCreateGoogleUser(payload: {
    sub: string; // Google's user ID
    email?: string;
    name?: string;
    picture?: string;
  }): Promise<{ user: UserWithHousehold; isNewUser: boolean }> {
    // First, try to find user by Google ID
    let user = await this.authRepository.findUserByGoogleId(payload.sub);
    let isNewUser = false;

    if (!user) {
      // Check by email in case user existed before Google sign-in
      user = await this.authRepository.findUserByEmail(payload.email!);
      if (user) {
        // Link existing user to Google account (not a new user)
        user = await this.authRepository.updateUser(user.id, {
          googleId: payload.sub,
          name: payload.name,
          avatarUrl: payload.picture,
        });
        isNewUser = false;
      } else {
        // Create new user with generated UUID
        const newUserId = this.uuidService.generate();
        user = await this.authRepository.createUser({
          id: newUserId,
          email: payload.email,
          googleId: payload.sub,
          name: payload.name,
          avatarUrl: payload.picture,
        });
        isNewUser = true;
      }
    } else {
      // User exists with Google ID - update profile (not a new user)
      user = await this.authRepository.updateUser(user.id, {
        name: payload.name,
        avatarUrl: payload.picture,
      });
      isNewUser = false;
    }

    return { user: user as UserWithHousehold, isNewUser };
  }

  /**
   * Derives a default household name from email and optional display name.
   * Prefer display name (title-cased + "'s family"); fallback to email local-part; edge case "My family".
   *
   * @param email - User email (used for fallback when display name is empty)
   * @param displayName - Optional display name from Google (payload.name)
   * @returns Default household name, e.g. "John's family" or "My family"
   */
  private deriveDefaultHouseholdName(
    email: string,
    displayName?: string | null,
  ): string {
    const trimmedDisplay =
      displayName != null && typeof displayName === 'string'
        ? displayName.trim()
        : '';
    if (trimmedDisplay.length > 0) {
      const name = this.toTitleCase(trimmedDisplay);
      if (name.length > 0) return `${name}'s family`;
    }
    const localPart = (email ?? '').trim().split('@')[0] ?? '';
    const normalizedLocal = localPart.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
    if (normalizedLocal.length > 0) {
      const name = this.toTitleCase(normalizedLocal);
      if (name.length > 0) return `${name}'s family`;
    }
    return 'My family';
  }

  /**
   * Capitalizes the first letter of each word (split on spaces).
   */
  private toTitleCase(s: string): string {
    return s
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Resolves household from auth payload and attaches user to it.
   * New household: name present (optional id) → create and set user as Admin.
   * Existing household: id only → add user as Member.
   */
  private async resolveAndAttachHousehold(
    userId: string,
    household: UserCreationHouseholdDto,
  ): Promise<void> {
    const trimmedName =
      household.name != null && typeof household.name === 'string'
        ? household.name.trim()
        : '';

    const inviteCode = household.inviteCode?.trim();

    if (trimmedName.length > 0) {
      await this.householdsService.createHouseholdForNewUser(
        userId,
        trimmedName,
        household.id,
      );
    } else if (inviteCode) {
      // Validate invite code and get householdId
      const { householdId } =
        await this.householdsService.validateInviteCode(inviteCode);
      await this.householdsService.addUserToHousehold(householdId, userId);
    } else if (
      household.id != null &&
      typeof household.id === 'string' &&
      household.id.trim().length > 0
    ) {
      // Joining by ID directly (legacy/insecure if not validated, but keeping for backward compatibility/other flows)
      // Ideally we should enforce inviteCode for all join flows
      await this.householdsService.addUserToHousehold(
        household.id.trim(),
        userId,
      );
    } else {
      throw new BadRequestException(
        'Household must specify name (new household), inviteCode (join), or id (existing household).',
      );
    }
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
  private async validateUserHasHousehold(
    userId: string,
  ): Promise<UserWithHousehold> {
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
   * Processes entities with success/failure tracking.
   * Generic helper to reduce duplication across sync methods.
   *
   * @param entities - Array of entities to process
   * @param entityType - Type of entity for conflict reporting
   * @param processEntityFn - Function to process a single entity
   * @returns Object with succeeded and conflicts arrays
   */
  private async processEntitiesWithTracking<
    T extends { operationId: string; id: string },
  >(
    entities: T[],
    entityType: 'list' | 'recipe' | 'chore' | 'shoppingItem',
    processEntityFn: (entity: T) => Promise<void>,
  ): Promise<{
    succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }>;
    conflicts: SyncConflict[];
  }> {
    const succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }> = [];
    const conflicts: SyncConflict[] = [];

    for (const entity of entities) {
      try {
        await processEntityFn(entity);
        succeeded.push({
          operationId: entity.operationId,
          id: entity.id,
          clientLocalId: entity.id, // For creates, this is the original localId
        });
      } catch (error) {
        conflicts.push({
          type: entityType,
          id: entity.id,
          operationId: entity.operationId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { succeeded, conflicts };
  }

  /**
   * Processes an entity with idempotency checking using insert-first pattern.
   *
   * Atomic processing flow:
   * 1. Try to insert idempotency key (unique constraint = already processed → skip)
   * 2. If insert succeeds, we "own" this operation → process entity
   * 3. If processing succeeds, mark key as COMPLETED
   * 4. If processing fails, delete key to allow retry
   *
   * @param userId - User ID performing the operation
   * @param operationId - Idempotency key (operationId from client)
   * @param entityType - Type of entity (from SYNC_ENTITY_TYPES constant)
   * @param entityId - Entity ID being processed
   * @param requestId - Optional request ID for observability
   * @param processFn - Function to process the entity (upsert, etc.)
   * @throws Error if processing fails (after deleting key to allow retry)
   */
  private async processEntityWithIdempotency(
    userId: string,
    operationId: string,
    entityType: SyncEntityType,
    entityId: string,
    requestId: string | undefined,
    processFn: () => Promise<void>,
  ): Promise<void> {
    // Try to insert idempotency key first (atomic check)
    // Store the created key's ID to avoid redundant queries later
    let idempotencyKeyId: string | null = null;

    try {
      const created = await this.prisma.syncIdempotencyKey.create({
        data: {
          userId,
          key: operationId,
          entityType,
          entityId,
          requestId,
          status: 'PENDING',
        },
      });
      idempotencyKeyId = created.id;
    } catch (error) {
      // Unique constraint violation = already processed
      if (isPrismaUniqueConstraintError(error)) {
        // Already processed, skip
        this.logger.debug('Skipping duplicate operation', {
          userId,
          operationId,
          entityType,
          entityId,
        });
        return;
      }
      // Other error, re-throw
      throw error;
    }

    // We "own" this operation now, process it
    try {
      await processFn();

      // Mark as completed using stored ID (no query needed)
      if (!idempotencyKeyId) {
        // This should never happen, but handle gracefully
        this.logger.error('Idempotency key ID missing after creation', {
          userId,
          operationId,
        });
        throw new Error(
          `Idempotency key ID missing after creation: ${operationId}`,
        );
      }

      await this.prisma.syncIdempotencyKey.update({
        where: { id: idempotencyKeyId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });
    } catch (error) {
      // If processing fails, delete the key row to allow retry using stored ID
      if (idempotencyKeyId) {
        try {
          await this.prisma.syncIdempotencyKey.delete({
            where: { id: idempotencyKeyId },
          });
        } catch (deleteError) {
          // Log but don't throw - original error is more important
          this.logger.warn(
            'Failed to delete idempotency key after processing failure',
            {
              idempotencyKeyId,
              error: deleteError,
            },
          );
        }
      }
      // Re-throw original error
      throw error;
    }
  }

  /**
   * Synchronizes shopping lists and their items.
   * Returns both succeeded and failed entities with operationId mapping.
   * Tracks both lists and their nested items separately.
   */
  private async syncShoppingLists(
    userId: string,
    householdId: string,
    lists: SyncShoppingListDto[],
    requestId: string | undefined,
  ): Promise<{
    succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }>;
    conflicts: SyncConflict[];
  }> {
    const succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }> = [];
    const conflicts: SyncConflict[] = [];

    for (const list of lists) {
      try {
        const { itemResults } = await this.syncShoppingList(
          userId,
          householdId,
          list,
          requestId,
        );
        // Include clientLocalId for create operations (id was localId)
        succeeded.push({
          operationId: list.operationId,
          id: list.id, // Server ID (may be same as clientLocalId if create)
          clientLocalId: list.id, // For creates, this is the original localId
        });

        // Track nested items separately
        succeeded.push(...itemResults.succeeded);
        conflicts.push(...itemResults.conflicts);
      } catch (error) {
        conflicts.push({
          type: 'list',
          id: list.id,
          operationId: list.operationId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { succeeded, conflicts };
  }

  /**
   * Synchronizes a single shopping list and its items.
   *
   * **Note:** Uses simple `upsert` without timestamp-based conflict resolution.
   * Client-side conflict resolution handles all conflicts using LWW strategy.
   * Server timestamps are authoritative (Prisma auto-manages `updatedAt`).
   *
   * **Idempotency:** Uses insert-first pattern to prevent duplicate processing.
   *
   * Returns item results for aggregation at the syncShoppingLists level.
   */
  private async syncShoppingList(
    userId: string,
    householdId: string,
    list: SyncShoppingListDto,
    requestId: string | undefined,
  ): Promise<{
    itemResults: {
      succeeded: Array<{
        operationId: string;
        id: string;
        clientLocalId?: string;
      }>;
      conflicts: SyncConflict[];
    };
  }> {
    let itemResults: {
      succeeded: Array<{
        operationId: string;
        id: string;
        clientLocalId?: string;
      }>;
      conflicts: SyncConflict[];
    } = { succeeded: [], conflicts: [] };

    await this.processEntityWithIdempotency(
      userId,
      list.operationId,
      SYNC_ENTITY_TYPES.SHOPPING_LIST,
      list.id,
      requestId,
      async () => {
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
          itemResults = await this.syncShoppingItems(
            userId,
            list.id,
            list.items,
            requestId,
          );
        }
      },
    );

    return { itemResults };
  }

  /**
   * Synchronizes shopping items for a list.
   * Each item has its own operationId for idempotency.
   * Returns both succeeded and failed items with operationId mapping.
   */
  private async syncShoppingItems(
    userId: string,
    listId: string,
    items: SyncShoppingListDto['items'],
    requestId: string | undefined,
  ): Promise<{
    succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }>;
    conflicts: SyncConflict[];
  }> {
    if (!items) {
      return { succeeded: [], conflicts: [] };
    }

    return this.processEntitiesWithTracking(
      items,
      'shoppingItem',
      async (item) => {
        await this.processEntityWithIdempotency(
          userId,
          item.operationId,
          SYNC_ENTITY_TYPES.SHOPPING_ITEM,
          item.id,
          requestId,
          async () => {
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
          },
        );
      },
    );
  }

  /**
   * Synchronizes recipes.
   *
   * **Note:** Uses simple `upsert` without timestamp-based conflict resolution.
   * Client-side conflict resolution handles all conflicts using LWW strategy.
   * Server timestamps are authoritative (Prisma auto-manages `updatedAt`).
   *
   * **Idempotency:** Uses insert-first pattern to prevent duplicate processing.
   * Returns both succeeded and failed entities with operationId mapping.
   */
  private async syncRecipes(
    userId: string,
    householdId: string,
    recipes: SyncRecipeDto[],
    requestId: string | undefined,
  ): Promise<{
    succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }>;
    conflicts: SyncConflict[];
  }> {
    return this.processEntitiesWithTracking(
      recipes,
      'recipe',
      async (recipe) => {
        await this.processEntityWithIdempotency(
          userId,
          recipe.operationId,
          SYNC_ENTITY_TYPES.RECIPE,
          recipe.id,
          requestId,
          async () => {
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
          },
        );
      },
    );
  }

  /**
   * Synchronizes chores.
   *
   * **Note:** Uses simple `upsert` without timestamp-based conflict resolution.
   * Client-side conflict resolution handles all conflicts using LWW strategy.
   * Server timestamps are authoritative (Prisma auto-manages `updatedAt`).
   *
   * **Idempotency:** Uses insert-first pattern to prevent duplicate processing.
   * Returns both succeeded and failed entities with operationId mapping.
   */
  private async syncChores(
    userId: string,
    householdId: string,
    chores: SyncChoreDto[],
    requestId: string | undefined,
  ): Promise<{
    succeeded: Array<{
      operationId: string;
      id: string;
      clientLocalId?: string;
    }>;
    conflicts: SyncConflict[];
  }> {
    return this.processEntitiesWithTracking(chores, 'chore', async (chore) => {
      await this.processEntityWithIdempotency(
        userId,
        chore.operationId,
        SYNC_ENTITY_TYPES.CHORE,
        chore.id,
        requestId,
        async () => {
          const dueDate = this.parseOptionalDueDate(chore.dueDate);
          await this.prisma.chore.upsert({
            where: { id: chore.id },
            create: {
              id: chore.id,
              householdId,
              title: chore.title,
              assigneeId: chore.assigneeId,
              dueDate,
              isCompleted: chore.isCompleted || false,
            },
            update: {
              title: chore.title,
              assigneeId: chore.assigneeId,
              dueDate,
              isCompleted: chore.isCompleted,
            },
          });
        },
      );
    });
  }

  /**
   * Parses an optional due date string for chore sync.
   * Returns null for missing, empty, or invalid date strings to avoid Prisma "Invalid Date" errors.
   */
  private parseOptionalDueDate(dueDate: string | undefined): Date | null {
    if (dueDate == null || String(dueDate).trim() === '') {
      return null;
    }
    const parsed = new Date(dueDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Generates access and refresh tokens for a user.
   */
  private async generateTokens(
    user: User & { household: Household | null },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const config = loadConfiguration();
    const payload = this.createJwtPayload(user);

    const accessToken = await this.jwtService.signAsync(
      payload as unknown as Record<string, unknown>,
      {
        secret: config.jwt.secret,
        expiresIn: config.jwt.expiresIn,
      } as any,
    );

    const refreshToken = await this.jwtService.signAsync(
      payload as unknown as Record<string, unknown>,
      {
        secret: config.jwt.refreshSecret,
        expiresIn: config.jwt.refreshExpiresIn,
      } as any,
    );

    const expiresAt = this.calculateRefreshTokenExpiry();

    // Before creating a new refresh token, delete any existing ones for this user.
    // This prevents 'Unique constraint failed' errors (P2002) that occur when:
    // - verifyEmail() generates tokens for auto-login
    // - login() is called immediately after, generating another token
    // The refreshToken.token field has a unique constraint, so we ensure only one
    // active token exists per user at any time.
    try {
      await this.authRepository.deleteAllRefreshTokensForUser(user.id);
    } catch (error) {
      this.logger.warn(
        'Failed to delete existing refresh tokens, continuing with creation',
        {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      // Continue - worst case is we have multiple tokens (handled by unique constraint)
    }

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
  private mapUserToResponse(
    user: User & { household: Household | null },
  ): UserResponseDto {
    return {
      id: user.id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role,
      isGuest: user.isGuest,
      householdId: user.householdId,
    };
  }

  /**
   * Registers a new user with email and password.
   *
   * @param dto - Registration data (email, password, optional name and household)
   * @returns Success message (user must verify email before login)
   * @throws ConflictException if email already exists
   * @throws BadRequestException if validation fails
   */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(dto.password);

    // Generate email verification token
    const verificationToken = this.generateEmailVerificationToken();
    const tokenExpiry = new Date();
    const expiryHours = this.config.email?.verificationTokenExpiryHours ?? 24;
    tokenExpiry.setHours(tokenExpiry.getHours() + expiryHours);

    // Create user
    const userId = this.uuidService.generate();
    await this.authRepository.createUser({
      id: userId,
      email: dto.email,
      passwordHash,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: tokenExpiry,
      name: dto.name,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      dto.email,
      verificationToken,
      dto.name,
    );

    // Handle household creation if provided
    if (dto.household) {
      await this.resolveAndAttachHousehold(userId, dto.household);
    } else {
      // Create default household
      const defaultName = this.deriveDefaultHouseholdName(dto.email, dto.name);
      await this.resolveAndAttachHousehold(userId, { name: defaultName });
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param dto - Login credentials (email and password)
   * @returns Authentication response with tokens and user info
   * @throws UnauthorizedException if credentials are invalid or email not verified
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user has password (email/password user)
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This email is registered with Google sign-in. Please use Google to sign in.',
      );
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    // Generate tokens
    const userWithHousehold = user as UserWithHousehold;
    const tokens = await this.generateTokens(userWithHousehold);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapUserToResponse(userWithHousehold),
      householdId: userWithHousehold.householdId,
      isNewUser: false,
      isNewHousehold: false,
      household: userWithHousehold.household
        ? {
            id: userWithHousehold.household.id,
            name: userWithHousehold.household.name,
          }
        : undefined,
    };
  }

  /**
   * Verifies a user's email address using the verification token.
   *
   * @param dto - Contains the verification token
   * @returns Authentication response with tokens (auto-login after verification)
   * @throws BadRequestException if token is invalid or expired
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponseDto> {
    // Find user by verification token
    const user = await this.authRepository.findUserByEmailVerificationToken(
      dto.token,
    );

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired verification token. Please request a new verification email.',
      );
    }

    // Mark email as verified and clear token
    const verifiedUser = await this.authRepository.updateUserEmailVerification(
      user.id,
      true,
    );

    // Generate tokens for auto-login
    const tokens = await this.generateTokens(verifiedUser as UserWithHousehold);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapUserToResponse(verifiedUser),
      householdId: verifiedUser.householdId,
      isNewUser: true,
      isNewHousehold: false,
      household: verifiedUser.household
        ? {
            id: verifiedUser.household.id,
            name: verifiedUser.household.name,
          }
        : undefined,
    };
  }

  /**
   * Resends email verification email to the user.
   *
   * @param dto - Contains the user's email
   * @returns Success message
   * @throws BadRequestException if email not found or already verified
   */
  async resendVerificationEmail(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    // Find user by email
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          'If the email exists and is not verified, a verification email has been sent.',
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if user has password (email/password user)
    if (!user.passwordHash) {
      throw new BadRequestException(
        'This email is registered with Google sign-in. Email verification is not required.',
      );
    }

    // Generate new verification token
    const verificationToken = this.generateEmailVerificationToken();
    const tokenExpiry = new Date();
    const expiryHours = this.config.email?.verificationTokenExpiryHours ?? 24;
    tokenExpiry.setHours(tokenExpiry.getHours() + expiryHours);

    // Update user with new token
    await this.authRepository.updateUser(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: tokenExpiry,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      dto.email,
      verificationToken,
      user.name ?? undefined,
    );

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  /**
   * Hashes a password using bcrypt.
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifies a password against a hash.
   *
   * @param password - Plain text password
   * @param hash - Hashed password from database
   * @returns True if password matches hash
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates a cryptographically secure random token for email verification.
   *
   * @returns Random token string
   */
  private generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
