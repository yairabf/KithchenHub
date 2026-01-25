import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ChoresRepository } from '../repositories/chores.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  ChoreListResponseDto,
  ChoreDto,
  CreateChoreDto,
  UpdateChoreDto,
  ChoreStatsDto,
  ToggleCompletionDto,
} from '../dtos';

/**
 * Chores service managing household chores, assignments, and completion tracking.
 *
 * Responsibilities:
 * - Chore CRUD operations
 * - Chore assignment management
 * - Completion status tracking
 * - Chore statistics for dashboard
 */
@Injectable()
export class ChoresService {
  private readonly logger = new Logger(ChoresService.name);

  constructor(
    private choresRepository: ChoresRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * Gets chores for a household, organized by today and upcoming.
   *
   * @param householdId - The household ID
   * @param dateRange - Optional start and end date filters
   * @returns Chores organized by today and upcoming
   */
  async getChores(
    householdId: string,
    dateRange?: { start?: string; end?: string },
  ): Promise<ChoreListResponseDto> {
    const start = dateRange?.start ? new Date(dateRange.start) : undefined;
    const end = dateRange?.end ? new Date(dateRange.end) : undefined;

    const chores = await this.choresRepository.findChoresByHousehold(
      householdId,
      { start, end },
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayChores = chores
      .filter((chore) => {
        if (!chore.dueDate) return false;
        const dueDate = new Date(chore.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      })
      .map(this.mapChoreToDto);

    const upcomingChores = chores
      .filter((chore) => {
        if (!chore.dueDate) return false;
        const dueDate = new Date(chore.dueDate);
        return dueDate >= tomorrow;
      })
      .map(this.mapChoreToDto);

    return {
      today: todayChores,
      upcoming: upcomingChores,
    };
  }

  /**
   * Creates a new chore for a household.
   *
   * @param householdId - The household ID
   * @param dto - Chore creation data
   * @returns Created chore ID
   */
  async createChore(
    householdId: string,
    dto: CreateChoreDto,
  ): Promise<{ id: string }> {
    const chore = await this.choresRepository.createChore(householdId, {
      title: dto.title,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      repeat: dto.repeat,
    });

    return { id: chore.id };
  }

  /**
   * Updates a chore (assignment, title, due date).
   *
   * @param choreId - The chore ID
   * @param householdId - The household ID for authorization
   * @param dto - Update data
   * @returns Updated chore
   * @throws NotFoundException if chore doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async updateChore(
    choreId: string,
    householdId: string,
    dto: UpdateChoreDto,
  ): Promise<ChoreDto> {
    const chore = await this.choresRepository.findChoreById(choreId);

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    if (chore.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedChore = await this.choresRepository.updateChore(choreId, {
      title: dto.title,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    return this.mapChoreToDto(updatedChore);
  }

  /**
   * Toggles completion status of a chore.
   *
   * @param choreId - The chore ID
   * @param householdId - The household ID for authorization
   * @param dto - Contains completion status
   * @returns Updated chore statistics
   * @throws NotFoundException if chore doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async toggleCompletion(
    choreId: string,
    householdId: string,
    dto: ToggleCompletionDto,
  ): Promise<{ progress: ChoreStatsDto }> {
    const chore = await this.choresRepository.findChoreById(choreId);

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    if (chore.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    await this.choresRepository.toggleCompletion(choreId, dto.isCompleted);

    const stats =
      await this.choresRepository.countChoresByHousehold(householdId);

    return {
      progress: {
        total: stats.total,
        completed: stats.completed,
        pending: stats.total - stats.completed,
      },
    };
  }

  /**
   * Gets chore statistics for a household.
   *
   * @param householdId - The household ID
   * @param date - Optional date filter
   * @returns Chore statistics (total, completed, pending)
   */
  async getStats(householdId: string, date?: string): Promise<ChoreStatsDto> {
    const filterDate = date ? new Date(date) : undefined;
    const stats = await this.choresRepository.countChoresByHousehold(
      householdId,
      { date: filterDate },
    );

    return {
      total: stats.total,
      completed: stats.completed,
      pending: stats.total - stats.completed,
    };
  }

  /**
   * Maps chore entity to DTO.
   */
  private mapChoreToDto(chore: any): ChoreDto {
    return {
      id: chore.id,
      title: chore.title,
      assigneeId: chore.assigneeId,
      assigneeName: chore.assignee?.name,
      dueDate: chore.dueDate,
      isCompleted: chore.isCompleted,
      completedAt: chore.completedAt,
      repeat: chore.repeat,
    };
  }
}
