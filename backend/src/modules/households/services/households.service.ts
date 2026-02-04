import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { HouseholdsRepository } from '../repositories/households.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  HouseholdResponseDto,
  UpdateHouseholdDto,
  InviteMemberDto,
} from '../dtos';

/**
 * Household service managing household operations and member management.
 *
 * Responsibilities:
 * - Retrieve household information with members
 * - Update household settings (admin only)
 * - Invite new members (admin only)
 * - Remove household members (admin only)
 */
@Injectable()
export class HouseholdsService {
  private readonly logger = new Logger(HouseholdsService.name);

  constructor(
    private householdsRepository: HouseholdsRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * Gets the household for a user with all members.
   *
   * @param userId - The user ID
   * @returns Household details with member list
   * @throws NotFoundException if user doesn't belong to a household
   */
  async getHousehold(userId: string): Promise<HouseholdResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        household: {
          include: {
            users: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.householdId) {
      throw new NotFoundException('User does not belong to a household');
    }

    return {
      id: user.household.id,
      name: user.household.name,
      members: user.household.users.map((member) => ({
        id: member.id,
        email: member.email,
        name: member.name,
        avatarUrl: member.avatarUrl,
        role: member.role,
      })),
    };
  }

  /**
   * Creates a new household for a user.
   *
   * @param userId - The user ID
   * @param name - Household name
   * @returns Created household details
   */
  async createHousehold(
    userId: string,
    name: string,
  ): Promise<HouseholdResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.householdId)
      throw new ForbiddenException('User already has a household');

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create household
      const household = await tx.household.create({
        data: {
          name,
          users: {
            connect: { id: userId },
          },
        },
        include: {
          users: true,
        },
      });

      // Update user to be Admin
      await tx.user.update({
        where: { id: userId },
        data: { role: 'Admin' },
      });

      // Create default main shopping list
      await tx.shoppingList.create({
        data: {
          householdId: household.id,
          name: 'Weekly Shopping',
          color: '#4CAF50', // Green color for main list
          icon: 'cart-outline',
          isMain: true,
        },
      });

      return household;
    });

    return {
      id: result.id,
      name: result.name,
      members: result.users.map((member) => ({
        id: member.id,
        email: member.email,
        name: member.name,
        avatarUrl: member.avatarUrl,
        role: member.role ?? 'Admin',
      })),
    };
  }

  /**
   * Creates a new household for a user during auth flow (e.g. Google sign-up).
   * If the user already has a household (e.g. race from duplicate sign-up), returns that household id without creating another (race-safe).
   *
   * @param userId - The user ID to set as Admin
   * @param name - Household name (trimmed and length-validated by caller)
   * @param householdId - Optional household id (e.g. client-generated CUID)
   * @returns Created or existing household id
   */
  async createHouseholdForNewUser(
    userId: string,
    name: string,
    householdId?: string,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.householdId) return user.householdId;

    const household = await this.householdsRepository.createHousehold(
      name,
      householdId,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { householdId: household.id, role: 'Admin' },
    });
    return household.id;
  }

  /**
   * Adds an existing user to an existing household (e.g. join during auth).
   * No-op if user is already a member of this household (idempotent).
   *
   * @param householdId - The household to join
   * @param userId - The user ID to add as Member
   * @throws NotFoundException if household or user not found
   * @throws ForbiddenException if user already belongs to a different household
   */
  async addUserToHousehold(householdId: string, userId: string): Promise<void> {
    const household =
      await this.householdsRepository.findHouseholdById(householdId);
    if (!household) throw new NotFoundException('Household not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.householdId === householdId) return;
    if (user.householdId)
      throw new ForbiddenException('User already has a household');

    await this.prisma.user.update({
      where: { id: userId },
      data: { householdId, role: 'Member' },
    });
  }

  /**
   * Updates household settings (name, timezone).
   * Only admins can update household settings.
   *
   * @param userId - The user ID requesting the update
   * @param dto - Update data
   * @returns Updated household details
   * @throws NotFoundException if user doesn't belong to a household
   * @throws ForbiddenException if user is not an admin
   */
  async updateHousehold(
    userId: string,
    dto: UpdateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.householdId) {
      throw new NotFoundException('User does not belong to a household');
    }

    if (user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can update household');
    }

    const name =
      dto.name != null && typeof dto.name === 'string'
        ? dto.name.trim()
        : undefined;

    await this.householdsRepository.updateHousehold(user.householdId, {
      name,
    });

    return this.getHousehold(userId);
  }

  /**
   * Invites a new member to the household via email.
   * Only admins can invite members.
   *
   * @param userId - The user ID sending the invitation
   * @param dto - Contains the email to invite
   * @returns Invitation token
   * @throws NotFoundException if user doesn't belong to a household
   * @throws ForbiddenException if user is not an admin or email is already a member
   */
  async inviteMember(
    userId: string,
    dto: InviteMemberDto,
  ): Promise<{ inviteToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.householdId) {
      throw new NotFoundException('User does not belong to a household');
    }

    if (user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can invite members');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.householdId === user.householdId) {
      throw new ForbiddenException('User is already a member');
    }

    const inviteToken = `invite_${user.householdId}_${Date.now()}`;

    return { inviteToken };
  }

  /**
   * Parses an invite code into householdId and timestamp.
   * Token format: invite_<householdId>_<timestamp>.
   * Optional expiry can be added later by checking timestamp against current time
   * and throwing with the same client-visible error shape (e.g. NotFoundException).
   *
   * @param code - Raw invite code string
   * @returns Parsed { householdId, timestamp } or null if format is invalid
   */
  private parseInviteCode(
    code: string,
  ): { householdId: string; timestamp: number } | null {
    const trimmed = code?.trim();
    if (!trimmed) return null;
    const parts = trimmed.split('_');
    if (parts.length !== 3 || parts[0] !== 'invite' || !parts[1] || !parts[2])
      return null;
    const timestamp = Number(parts[2]);
    if (!Number.isFinite(timestamp)) return null;
    return { householdId: parts[1], timestamp };
  }

  /**
   * Validates an invite code and returns household id and name for display.
   * Public endpoint so unauthenticated users can resolve the code before sign-in.
   * Token format: invite_<householdId>_<timestamp>.
   *
   * @param code - The invite code (inviteToken) shared by a household member
   * @returns householdId and householdName
   * @throws BadRequestException if code format is invalid
   * @throws NotFoundException if household does not exist
   */
  async validateInviteCode(
    code: string,
  ): Promise<{ householdId: string; householdName: string }> {
    const parsed = this.parseInviteCode(code);
    if (!parsed) {
      throw new BadRequestException(
        code?.trim() ? 'Invalid invite code format' : 'Invite code is required',
      );
    }
    const household = await this.householdsRepository.findHouseholdById(
      parsed.householdId,
    );
    if (!household) {
      throw new NotFoundException('Invite code is invalid or expired');
    }
    return {
      householdId: household.id,
      householdName: household.name,
    };
  }

  /**
   * Removes a member from the household.
   * Only admins can remove members. Users cannot remove themselves.
   *
   * @param userId - The user ID requesting the removal
   * @param memberId - The ID of the member to remove
   * @throws NotFoundException if user doesn't belong to a household or member not found
   * @throws ForbiddenException if user is not an admin or trying to remove themselves
   */
  async removeMember(userId: string, memberId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.householdId) {
      throw new NotFoundException('User does not belong to a household');
    }

    if (user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can remove members');
    }

    if (userId === memberId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!member || member.householdId !== user.householdId) {
      throw new NotFoundException('Member not found in household');
    }

    await this.householdsRepository.removeUserFromHousehold(memberId);
  }
}
