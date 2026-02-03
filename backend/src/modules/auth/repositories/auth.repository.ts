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
    name?: string;
    avatarUrl?: string;
    householdId?: string;
  }): Promise<User & { household: Household | null }> {
    // Use Prisma's generated type for type safety instead of 'any'
    const createData: Prisma.UserUncheckedCreateInput = {
      id: data.id,
      email: data.email,
      googleId: data.googleId,
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
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
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
}
