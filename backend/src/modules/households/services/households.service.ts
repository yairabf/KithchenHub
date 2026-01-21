import {
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
  HouseholdMemberDto,
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

    const household = await this.householdsRepository.updateHousehold(
      user.householdId,
      { name: dto.name },
    );

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
