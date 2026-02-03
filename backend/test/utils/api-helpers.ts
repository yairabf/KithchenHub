/**
 * API helper utilities for E2E tests.
 * Centralizes common API request patterns to reduce code duplication.
 */

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { TEST_CONSTANTS } from './test-constants';
import type {
  RegisterResponse,
  VerifyEmailResponse,
  LoginResponse,
  CreateShoppingListResponse,
  GetShoppingListsResponse,
  GetShoppingListDetailResponse,
  AddItemsResponse,
  GetCustomItemsResponse,
  CreateRecipeResponse,
  GetRecipesResponse,
  GetRecipeDetailResponse,
  UpdateRecipeResponse,
  CreateChoreResponse,
  GetChoresResponse,
  UpdateChoreResponse,
  GetHouseholdResponse,
  UpdateHouseholdResponse,
} from './api-response-types';

/**
 * Helper class for making authenticated and unauthenticated API requests
 */
export class ApiTestHelpers {
  constructor(
    private readonly app: NestFastifyApplication,
    private accessToken?: string,
  ) {}

  /**
   * Sets the access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Makes an authenticated API request
   * Returns the request object so .expect() can be chained
   */
  private authenticatedRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    body?: unknown,
  ): request.Test {
    if (!this.accessToken) {
      throw new Error('Access token not set. Call setAccessToken() first.');
    }

    const req = request(this.app.getHttpServer())
      [method](`${TEST_CONSTANTS.API_URL}${endpoint}`)
      .set('Authorization', `Bearer ${this.accessToken}`);

    if (body) {
      req.send(body as object);
    }

    return req;
  }

  /**
   * Makes an unauthenticated API request
   * Returns the request object so .expect() can be chained
   */
  private unauthenticatedRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    body?: unknown,
  ): request.Test {
    const req = request(this.app.getHttpServer())[method](
      `${TEST_CONSTANTS.API_URL}${endpoint}`,
    );

    if (body) {
      req.send(body as object);
    }

    return req;
  }

  // Auth endpoints

  /**
   * Registers a new user
   * @param expectedStatus - Expected HTTP status code (default: 201)
   */
  async registerUser(
    email: string,
    password: string,
    name: string,
    expectedStatus: number = 201,
  ): Promise<RegisterResponse> {
    const response = await this.unauthenticatedRequest(
      'post',
      '/auth/register',
      {
        email,
        password,
        name,
      },
    ).expect(expectedStatus);

    return response.body as RegisterResponse;
  }

  /**
   * Verifies user email with token
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await this.unauthenticatedRequest(
      'get',
      '/auth/verify-email',
    )
      .query({ token })
      .expect(200);

    return response.body as VerifyEmailResponse;
  }

  /**
   * Logs in a user
   */
  async loginUser(email: string, password: string): Promise<LoginResponse> {
    const response = await this.unauthenticatedRequest('post', '/auth/login', {
      email,
      password,
    }).expect(200);

    return response.body as LoginResponse;
  }

  // Household endpoints

  /**
   * Gets the current user's household
   */
  async getHousehold(): Promise<GetHouseholdResponse> {
    const response = await this.authenticatedRequest(
      'get',
      '/household',
    ).expect(200);
    return response.body as GetHouseholdResponse;
  }

  /**
   * Updates the current user's household
   */
  async updateHousehold(name: string): Promise<UpdateHouseholdResponse> {
    const response = await this.authenticatedRequest('put', '/household', {
      name,
    }).expect(200);

    return response.body as UpdateHouseholdResponse;
  }

  // Shopping list endpoints

  /**
   * Creates a new shopping list
   */
  async createShoppingList(
    name: string,
    color?: string,
    icon?: string,
  ): Promise<CreateShoppingListResponse> {
    const response = await this.authenticatedRequest(
      'post',
      '/shopping-lists',
      {
        name,
        color,
        icon,
      },
    ).expect(201);

    return response.body as CreateShoppingListResponse;
  }

  /**
   * Gets all shopping lists
   * @param expectedStatus - Expected HTTP status code (default: 200)
   */
  async getShoppingLists(
    expectedStatus: number = 200,
  ): Promise<GetShoppingListsResponse> {
    const response = await this.authenticatedRequest(
      'get',
      '/shopping-lists',
    ).expect(expectedStatus);
    return response.body as GetShoppingListsResponse;
  }

  /**
   * Makes an authenticated request without expecting a specific status
   * Useful for testing error cases
   */
  async authenticatedRequestWithoutExpect(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    body?: unknown,
  ): Promise<request.Response> {
    if (!this.accessToken) {
      throw new Error('Access token not set. Call setAccessToken() first.');
    }

    const req = request(this.app.getHttpServer())
      [method](`${TEST_CONSTANTS.API_URL}${endpoint}`)
      .set('Authorization', `Bearer ${this.accessToken}`);

    if (body) {
      req.send(body as object);
    }

    return req;
  }

  /**
   * Makes an unauthenticated request without expecting a specific status
   * Useful for testing error cases
   */
  async unauthenticatedRequestWithoutExpect(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    body?: unknown,
  ): Promise<request.Response> {
    const req = request(this.app.getHttpServer())[method](
      `${TEST_CONSTANTS.API_URL}${endpoint}`,
    );

    if (body) {
      req.send(body as object);
    }

    return req;
  }

  /**
   * Gets a shopping list by ID with items
   */
  async getShoppingListDetail(
    listId: string,
  ): Promise<GetShoppingListDetailResponse> {
    const response = await this.authenticatedRequest(
      'get',
      `/shopping-lists/${listId}`,
    ).expect(200);

    return response.body as GetShoppingListDetailResponse;
  }

  /**
   * Deletes a shopping list
   */
  async deleteShoppingList(listId: string): Promise<void> {
    await this.authenticatedRequest(
      'delete',
      `/shopping-lists/${listId}`,
    ).expect(200);
  }

  // Shopping item endpoints

  /**
   * Adds items to a shopping list
   */
  async addItemsToList(
    listId: string,
    items: Array<{
      name?: string;
      catalogItemId?: string;
      masterItemId?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      image?: string;
      isChecked?: boolean;
    }>,
  ): Promise<AddItemsResponse> {
    const response = await this.authenticatedRequest(
      'post',
      `/shopping-lists/${listId}/items`,
      { items },
    ).expect(201);

    return response.body as AddItemsResponse;
  }

  /**
   * Deletes a shopping item
   */
  async deleteShoppingItem(itemId: string): Promise<void> {
    await this.authenticatedRequest(
      'delete',
      `/shopping-items/${itemId}`,
    ).expect(200);
  }

  /**
   * Gets custom items (user items)
   */
  async getCustomItems(): Promise<GetCustomItemsResponse> {
    const response = await this.authenticatedRequest(
      'get',
      '/shopping-items/custom',
    ).expect(200);

    return response.body as GetCustomItemsResponse;
  }

  // Recipe endpoints

  /**
   * Creates a new recipe
   */
  async createRecipe(recipe: {
    title: string;
    category?: string;
    prepTime?: number;
    cookTime?: number;
    ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
    instructions: Array<{ step: number; instruction: string }>;
    imageUrl?: string;
  }): Promise<CreateRecipeResponse> {
    const response = await this.authenticatedRequest(
      'post',
      '/recipes',
      recipe,
    ).expect(201);

    return response.body as CreateRecipeResponse;
  }

  /**
   * Gets all recipes
   */
  async getRecipes(): Promise<GetRecipesResponse> {
    const response = await this.authenticatedRequest('get', '/recipes').expect(
      200,
    );
    return response.body as GetRecipesResponse;
  }

  /**
   * Gets a recipe by ID
   */
  async getRecipeDetail(recipeId: string): Promise<GetRecipeDetailResponse> {
    const response = await this.authenticatedRequest(
      'get',
      `/recipes/${recipeId}`,
    ).expect(200);

    return response.body as GetRecipeDetailResponse;
  }

  /**
   * Updates a recipe
   */
  async updateRecipe(
    recipeId: string,
    updates: {
      title?: string;
      category?: string;
      prepTime?: number;
      cookTime?: number;
      ingredients?: Array<{ name: string; quantity?: number; unit?: string }>;
      instructions?: Array<{ step: number; instruction: string }>;
      imageUrl?: string;
    },
  ): Promise<UpdateRecipeResponse> {
    const response = await this.authenticatedRequest(
      'put',
      `/recipes/${recipeId}`,
      updates,
    ).expect(200);

    return response.body as UpdateRecipeResponse;
  }

  /**
   * Deletes a recipe
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    await this.authenticatedRequest('delete', `/recipes/${recipeId}`).expect(
      200,
    );
  }

  // Chore endpoints

  /**
   * Creates a new chore
   */
  async createChore(chore: {
    title: string;
    assigneeId?: string;
    dueDate?: string;
    repeat?: string;
  }): Promise<CreateChoreResponse> {
    const response = await this.authenticatedRequest(
      'post',
      '/chores',
      chore,
    ).expect(201);

    return response.body as CreateChoreResponse;
  }

  /**
   * Gets all chores
   */
  async getChores(): Promise<GetChoresResponse> {
    const response = await this.authenticatedRequest('get', '/chores').expect(
      200,
    );
    return response.body as GetChoresResponse;
  }

  /**
   * Updates a chore
   */
  async updateChore(
    choreId: string,
    updates: {
      title?: string;
      assigneeId?: string;
      dueDate?: string;
      repeat?: string;
    },
  ): Promise<UpdateChoreResponse> {
    const response = await this.authenticatedRequest(
      'patch',
      `/chores/${choreId}`,
      updates,
    ).expect(200);

    return response.body as UpdateChoreResponse;
  }

  /**
   * Deletes a chore
   */
  async deleteChore(choreId: string): Promise<void> {
    await this.authenticatedRequest('delete', `/chores/${choreId}`).expect(200);
  }
}
