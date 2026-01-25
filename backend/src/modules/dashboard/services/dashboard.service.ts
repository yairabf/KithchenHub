import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { DashboardSummaryDto, RecentActivityDto } from '../dtos';

/**
 * Dashboard service providing aggregated data for the home screen.
 *
 * Responsibilities:
 * - Aggregate counts from multiple modules
 * - Generate recent activity feed
 * - Provide time-based greetings
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Gets comprehensive dashboard summary for a user's household.
   * Aggregates data from shopping lists, chores, recipes, and recent activity.
   *
   * @param userId - The user ID
   * @param householdId - The household ID
   * @returns Dashboard summary with counts and recent activity
   */
  async getSummary(
    userId: string,
    householdId: string,
  ): Promise<DashboardSummaryDto> {
    const greeting = this.getGreeting();

    const [lists, chores, recipes, recentChores, recentItems] =
      await Promise.all([
        this.prisma.shoppingList.count({
          where: { householdId },
        }),
        this.prisma.chore.count({
          where: {
            householdId,
            isCompleted: false,
          },
        }),
        this.prisma.recipe.count({
          where: { householdId },
        }),
        this.prisma.chore.findMany({
          where: {
            householdId,
            completedAt: {
              not: null,
            },
          },
          include: {
            assignee: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
          take: 5,
        }),
        this.prisma.shoppingItem.findMany({
          where: {
            list: {
              householdId,
            },
          },
          include: {
            list: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        }),
      ]);

    const recentActivity: RecentActivityDto[] = [];

    recentChores.forEach((chore) => {
      if (chore.completedAt) {
        recentActivity.push({
          type: 'chore_completed',
          user: chore.assignee?.name || 'Unknown',
          item: chore.title,
          time: this.formatTime(chore.completedAt),
        });
      }
    });

    recentItems.forEach((item) => {
      recentActivity.push({
        type: 'list_item_added',
        user: 'User',
        item: item.name,
        time: this.formatTime(item.createdAt),
      });
    });

    recentActivity.sort((a, b) => {
      const timeA = this.parseTime(a.time);
      const timeB = this.parseTime(b.time);
      return timeB.getTime() - timeA.getTime();
    });

    return {
      greeting,
      activeListCount: lists,
      pendingChoresCount: chores,
      savedRecipesCount: recipes,
      recentActivity: recentActivity.slice(0, 10),
    };
  }

  /**
   * Gets time-appropriate greeting based on current hour.
   */
  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  /**
   * Formats a date to time string (HH:MM AM/PM).
   */
  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  /**
   * Parses a time string back to a Date object for sorting.
   */
  private parseTime(timeString: string): Date {
    const now = new Date();
    const [time, ampm] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    if (ampm === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }

    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    return date;
  }
}
