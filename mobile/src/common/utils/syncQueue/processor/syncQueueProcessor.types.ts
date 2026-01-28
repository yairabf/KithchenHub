import type { SyncEntityType } from '../../cacheMetadata';
import type { QueuedWrite } from '../storage';
import type { Recipe } from '../../../mocks/recipes';
import type { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import type { Chore } from '../../../mocks/chores';

/**
 * Sync result from backend.
 */
export interface SyncResult {
  status: 'synced' | 'partial' | 'failed';
  conflicts: Array<{
    type: 'list' | 'recipe' | 'chore' | 'shoppingItem';
    id: string;
    operationId: string;
    reason: string;
  }>;
  succeeded?: Array<{
    operationId: string;
    entityType: 'list' | 'recipe' | 'chore';
    id: string;
    clientLocalId?: string;
  }>;
}

/**
 * Sync payload DTOs for backend.
 */
export interface SyncRecipeDto {
  id: string;
  operationId: string;
  title: string;
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  instructions: Array<{ step: number; instruction: string }>;
}

export interface SyncShoppingItemDto {
  id: string;
  operationId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isChecked?: boolean;
}

export interface SyncShoppingListDto {
  id: string;
  operationId: string;
  name: string;
  color?: string;
  items?: SyncShoppingItemDto[];
}

export interface SyncChoreDto {
  id: string;
  operationId: string;
  title: string;
  assigneeId?: string;
  dueDate?: string;
  isCompleted?: boolean;
}

export interface SyncDataDto {
  requestId?: string;
  recipes?: SyncRecipeDto[];
  lists?: SyncShoppingListDto[];
  chores?: SyncChoreDto[];
}

/**
 * Error classification result for sync processing.
 */
export type ErrorClassification =
  | { type: 'RETRY'; shouldIncrement: boolean }
  | { type: 'STOP_WORKER'; reason: string }
  | { type: 'DEAD_LETTER'; reason: string };

/**
 * Helper types used by payload-building helpers.
 */
export type GroupedEntities = {
  recipes: Array<{ entity: Recipe; operationId: string }>;
  lists: Array<{ entity: ShoppingList; operationId: string }>;
  items: Array<{ entity: ShoppingItem; operationId: string }>;
  chores: Array<{ entity: Chore; operationId: string }>;
};

export type EntityMap = Map<string, QueuedWrite>;

export type ServerIdMappings = Map<
  string,
  {
    serverId: string;
    entityType: SyncEntityType;
  }
>;

