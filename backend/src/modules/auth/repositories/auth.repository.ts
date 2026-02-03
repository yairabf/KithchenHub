import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { User, RefreshToken, Household, Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { household: true },
    });
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
      include: { household: true },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { household: true },
    });
  }

  async createUser(data: {
    id?: string;
    email?: string;
    googleId?: string;
    passwordHash?: string;
    emailVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationTokenExpiry?: Date;
    name?: string;
    avatarUrl?: string;
    householdId?: string;
  }): Promise<User & { household: Household | null }> {
    // Use Prisma's generated type for type safety instead of 'any'
    const createData: Prisma.UserUncheckedCreateInput = {
      id: data.id,
      email: data.email,
      googleId: data.googleId,
      passwordHash: data.passwordHash,
      emailVerified: data.emailVerified,
      emailVerificationToken: data.emailVerificationToken,
      emailVerificationTokenExpiry: data.emailVerificationTokenExpiry,
      name: data.name,
      avatarUrl: data.avatarUrl,
      householdId: data.householdId,
    };

    const result = await this.prisma.user.create({
      data: createData,
      include: { household: true },
    });

    // Prisma returns the correct shape with include, but TypeScript needs help with the return type
    return result as unknown as User & { household: Household | null };
  }

  async updateUser(
    userId: string,
    data: {
      email?: string;
      googleId?: string;
      passwordHash?: string;
      emailVerified?: boolean;
      emailVerificationToken?: string | null;
      emailVerificationTokenExpiry?: Date | null;
      name?: string;
      avatarUrl?: string;
      householdId?: string;
    },
  ): Promise<User & { household: Household | null }> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { household: true },
    });
  }

  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    try {
      const result = await this.prisma.refreshToken.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      });
      return result;
    } catch (error: unknown) {
      throw error;
    }
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Deletes all refresh tokens for a specific user.
   *
   * This method is used to ensure only one active refresh token exists per user
   * at any given time, preventing unique constraint violations when generating
   * new tokens.
   *
   * @param userId - The ID of the user whose refresh tokens should be deleted
   * @returns Promise that resolves when deletion is complete
   * @throws PrismaClientKnownRequestError if database operation fails
   */
  async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async findUserByEmailVerificationToken(
    token: string,
  ): Promise<(User & { household: Household | null }) | null> {
    return this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: {
          gt: new Date(),
        },
      },
      include: { household: true },
    });
  }

  async updateUserEmailVerification(
    userId: string,
    verified: boolean,
  ): Promise<User & { household: Household | null }> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: verified,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
      include: { household: true },
    });
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<User & { household: Household | null }> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: { household: true },
    });
  }
}
