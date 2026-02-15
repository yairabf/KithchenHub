import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { HouseholdsRepository } from '../repositories/households.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import {
  HouseholdResponseDto,
  UpdateHouseholdDto,
  InviteMemberDto,
} from '../dtos';
import { DEFAULT_MAIN_SHOPPING_LIST } from '../../shopping/constants/defaults';
import { HouseholdUtils } from '../../../common/utils/household.utils';

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
    private auditService: AuditService,
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
          name: DEFAULT_MAIN_SHOPPING_LIST.NAME,
          color: DEFAULT_MAIN_SHOPPING_LIST.COLOR,
          icon: DEFAULT_MAIN_SHOPPING_LIST.ICON,
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
    void dto; // Invite is code-only; DTO kept for API compatibility
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.householdId) {
      throw new NotFoundException('User does not belong to a household');
    }

    if (user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can invite members');
    }

    const code = HouseholdUtils.generateInviteCode();

    await this.prisma.householdInvite.create({
      data: {
        code,
        householdId: user.householdId,
        creatorId: userId,
      },
    });

    return { inviteToken: code };
  }

  /**
   * Validates an invite code and returns household id and name for display.
   * Public endpoint so unauthenticated users can resolve the code before sign-in.
   *
   * @param code - The invite code shared by a household member
   * @returns householdId and householdName
   * @throws NotFoundException if invite code is invalid or expired
   */
  async validateInviteCode(
    code: string,
  ): Promise<{ householdId: string; householdName: string }> {
    const trimmed = code?.trim();
    if (!trimmed) {
      throw new BadRequestException('Invite code is required');
    }

    const invite = await this.prisma.householdInvite.findUnique({
      where: { code: trimmed },
      include: { household: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite code is invalid or expired');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new NotFoundException('Invite code has expired');
    }

    return {
      householdId: invite.householdId,
      householdName: invite.household.name,
    };
  }

  /**
   * Joins a household using an invite code.
   *
   * @param userId - The user ID joining
   * @param code - The invite code
   * @returns Joined household details
   */
  async joinHousehold(
    userId: string,
    code: string,
  ): Promise<HouseholdResponseDto> {
    const trimmed = code?.trim();
    if (!trimmed) {
      throw new BadRequestException('Invite code is required');
    }

    const invite = await this.prisma.householdInvite.findUnique({
      where: { code: trimmed },
    });

    if (!invite) {
      throw new NotFoundException('Invite code is invalid or expired');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new NotFoundException('Invite code has expired');
    }

    const householdId = invite.householdId;

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.householdId) {
        throw new ForbiddenException('User already belongs to a household');
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          householdId,
          role: 'Member',
          joinedViaInviteId: invite.id,
        },
      });
    });

    return this.getHousehold(userId);
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

    await this.auditService.logRemoveMember(userId, user.householdId, memberId);
    await this.householdsRepository.removeUserFromHousehold(memberId);
  }
}
