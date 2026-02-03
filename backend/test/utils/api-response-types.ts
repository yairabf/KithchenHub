/**
 * Type definitions for API responses in E2E tests.
 * These types ensure type safety and eliminate the need for 'any' types.
 */

import {
  AuthResponseDto,
  UserResponseDto,
  HouseholdSummaryDto,
} from '../../src/modules/auth/dtos/auth-response.dto';
import {
  ShoppingListSummaryDto,
  ShoppingItemDto,
  ShoppingListDetailDto,
} from '../../src/modules/shopping/dtos/shopping-list-response.dto';
import { RecipeDetailDto } from '../../src/modules/recipes/dtos/recipe-detail-response.dto';
import { RecipeListItemDto } from '../../src/modules/recipes/dtos/recipe-list-response.dto';
import {
  ChoreDto,
  ChoreListResponseDto,
} from '../../src/modules/chores/dtos/chore-list-response.dto';

// Re-export DTOs for use in tests
export type {
  ShoppingListSummaryDto,
  ShoppingItemDto,
  ShoppingListDetailDto,
  RecipeListItemDto,
  RecipeDetailDto,
  ChoreDto,
  ChoreListResponseDto,
  UserResponseDto,
  HouseholdSummaryDto,
  AuthResponseDto,
};

/**
 * Standard API response wrapper used by all endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * Auth API response types
 */
export type RegisterResponse = ApiResponse<{ message: string }>;
export type VerifyEmailResponse = ApiResponse<AuthResponseDto>;
export type LoginResponse = ApiResponse<AuthResponseDto>;
export type GetCurrentUserResponse = ApiResponse<UserResponseDto>;

/**
 * Household API response types
 */
export type GetHouseholdResponse = ApiResponse<HouseholdSummaryDto>;
export type UpdateHouseholdResponse = ApiResponse<HouseholdSummaryDto>;

/**
 * Shopping API response types
 */
export type CreateShoppingListResponse = ApiResponse<ShoppingListSummaryDto>;
export type GetShoppingListsResponse = ApiResponse<ShoppingListSummaryDto[]>;
export type GetShoppingListDetailResponse = ApiResponse<ShoppingListDetailDto>;
export type AddItemsResponse = ApiResponse<{ addedItems: ShoppingItemDto[] }>;
export type GetCustomItemsResponse = ApiResponse<ShoppingItemDto[]>;

/**
 * Recipe API response types
 */
export type CreateRecipeResponse = ApiResponse<RecipeDetailDto>;
export type GetRecipesResponse = ApiResponse<RecipeListItemDto[]>;
export type GetRecipeDetailResponse = ApiResponse<RecipeDetailDto>;
export type UpdateRecipeResponse = ApiResponse<RecipeDetailDto>;

/**
 * Chore API response types
 */
export type CreateChoreResponse = ApiResponse<ChoreDto>;
export type GetChoresResponse = ApiResponse<ChoreListResponseDto>;
export type UpdateChoreResponse = ApiResponse<ChoreDto>;
