import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { ApiTestHelpers } from './utils/api-helpers';
import { cleanupTestUserData } from './utils/cleanup-helpers';
import {
  TEST_CONSTANTS,
  generateTestEmail,
  createDateWithOffset,
} from './utils/test-constants';
import type {
  ShoppingItemDto,
  ShoppingListSummaryDto,
  RecipeListItemDto,
  ChoreDto,
} from './utils/api-response-types';

describe('Auth Flow E2E Test', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let apiHelpers: ApiTestHelpers;

  // Test context - shared state for the complete flow
  let testContext: {
    accessToken: string;
    userId: string;
    householdId: string;
  };

  // Entity IDs tracked for cleanup
  const createdEntityIds = {
    shoppingListIds: [] as string[],
    recipeIds: [] as string[],
    choreIds: [] as string[],
  };

  const testEmail = generateTestEmail();
  const testPassword = TEST_CONSTANTS.USER.PASSWORD;
  const testName = TEST_CONSTANTS.USER.NAME;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // Configure app same as main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Initialize API helpers
    apiHelpers = new ApiTestHelpers(app);
  });

  afterAll(async () => {
    // Comprehensive cleanup: delete all test data
    if (testContext?.userId) {
      await cleanupTestUserData(
        prisma,
        testContext.userId,
        testContext.householdId,
      );
    }
    await app.close();
  });

  describe('Complete User Flow', () => {
    // Step 1: Create user
    it('should create a new user', async () => {
      const registerResponse = await apiHelpers.registerUser(
        testEmail,
        testPassword,
        testName,
      );

      expect(registerResponse.success).toBe(true);
      expect(registerResponse.data.message).toBe(
        'Registration successful. Please check your email to verify your account.',
      );
    });

    // Step 2: Verify email (get token from database)
    it('should verify email', async () => {
      // Get the verification token from the database
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(user).toBeDefined();
      expect(user?.emailVerificationToken).toBeDefined();

      // Verify email using the token
      const verifyResponse = await apiHelpers.verifyEmail(
        user!.emailVerificationToken!,
      );

      expect(verifyResponse.success).toBe(true);
      expect(verifyResponse.data.accessToken).toBeDefined();

      // Store context for subsequent requests
      testContext = {
        accessToken: verifyResponse.data.accessToken,
        userId: verifyResponse.data.user.id,
        householdId:
          verifyResponse.data.householdId ||
          verifyResponse.data.user.householdId!,
      };

      apiHelpers.setAccessToken(testContext.accessToken);
    });

    // Step 3: Login (after email verification)
    it('should login user after email verification', async () => {
      const loginResponse = await apiHelpers.loginUser(testEmail, testPassword);

      expect(loginResponse.success).toBe(true);
      expect(loginResponse.data.accessToken).toBeDefined();
      expect(loginResponse.data.user).toBeDefined();

      // Update context if needed
      if (!testContext) {
        testContext = {
          accessToken: loginResponse.data.accessToken,
          userId: loginResponse.data.user.id,
          householdId:
            loginResponse.data.householdId ||
            loginResponse.data.user.householdId!,
        };
        apiHelpers.setAccessToken(testContext.accessToken);
      }

      expect(testContext.householdId).toBeDefined();
    });

    // Step 4: Edit Household and confirm edit succeeded
    it('should edit household and confirm edit succeeded', async () => {
      const updatedName = TEST_CONSTANTS.HOUSEHOLD.NAME_1;

      const updateResponse = await apiHelpers.updateHousehold(updatedName);

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.name).toBe(updatedName);

      // Verify by getting household
      const getResponse = await apiHelpers.getHousehold();

      expect(getResponse.success).toBe(true);
      expect(getResponse.data.name).toBe(updatedName);
    });

    // Step 5: Create custom item (by adding item to shopping list)
    it('should create a shopping list first', async () => {
      const createResponse = await apiHelpers.createShoppingList(
        TEST_CONSTANTS.SHOPPING_LIST.NAME_1,
        TEST_CONSTANTS.SHOPPING_LIST.COLOR_1,
      );

      expect(createResponse.success).toBe(true);
      expect(createResponse.data.id).toBeDefined();

      createdEntityIds.shoppingListIds.push(createResponse.data.id);
    });

    it('should create custom item by adding to shopping list', async () => {
      const listId = createdEntityIds.shoppingListIds[0];
      const customItemName = TEST_CONSTANTS.SHOPPING_ITEM.CUSTOM_NAME_1;

      const addItemsResponse = await apiHelpers.addItemsToList(listId, [
        {
          name: customItemName,
          quantity: TEST_CONSTANTS.SHOPPING_ITEM.QUANTITY_1,
          unit: TEST_CONSTANTS.SHOPPING_ITEM.UNIT_PIECES,
        },
      ]);

      expect(addItemsResponse.success).toBe(true);
      expect(addItemsResponse.data.addedItems).toBeDefined();
      expect(addItemsResponse.data.addedItems.length).toBe(1);
    });

    // Step 6: Get custom item
    it('should get custom items', async () => {
      const customItemsResponse = await apiHelpers.getCustomItems();

      expect(customItemsResponse.success).toBe(true);
      expect(customItemsResponse.data).toBeDefined();
      expect(Array.isArray(customItemsResponse.data)).toBe(true);

      const customItem = customItemsResponse.data.find(
        (item: ShoppingItemDto) =>
          item.name === TEST_CONSTANTS.SHOPPING_ITEM.CUSTOM_NAME_1,
      );
      expect(customItem).toBeDefined();
    });

    // Step 7: User create a shopping list (already done, but creating another)
    it('should create another shopping list', async () => {
      const createResponse = await apiHelpers.createShoppingList(
        TEST_CONSTANTS.SHOPPING_LIST.NAME_2,
        TEST_CONSTANTS.SHOPPING_LIST.COLOR_2,
      );

      expect(createResponse.success).toBe(true);
      createdEntityIds.shoppingListIds.push(createResponse.data.id);
    });

    // Step 8: User add custom item to shopping list
    it('should add custom item to shopping list', async () => {
      const listId = createdEntityIds.shoppingListIds[1];

      const addItemsResponse = await apiHelpers.addItemsToList(listId, [
        {
          name: TEST_CONSTANTS.SHOPPING_ITEM.CUSTOM_NAME_1, // Should reuse existing custom item
          quantity: TEST_CONSTANTS.SHOPPING_ITEM.QUANTITY_2,
        },
      ]);

      expect(addItemsResponse.success).toBe(true);
      expect(addItemsResponse.data.addedItems.length).toBe(1);
    });

    // Step 9: User add custom item to shopping and then remove it - validate removal
    it('should add custom item to shopping list and then remove it', async () => {
      const listId = createdEntityIds.shoppingListIds[1];
      const temporaryItemName = TEST_CONSTANTS.SHOPPING_ITEM.CUSTOM_NAME_2;

      // Add item
      const addItemsResponse = await apiHelpers.addItemsToList(listId, [
        {
          name: temporaryItemName,
          quantity: TEST_CONSTANTS.SHOPPING_ITEM.QUANTITY_3,
        },
      ]);

      const addedItemId = addItemsResponse.data.addedItems[0].id;

      // Verify item is in the list
      const listDetailResponse = await apiHelpers.getShoppingListDetail(listId);

      const itemInList = listDetailResponse.data.items.find(
        (item: ShoppingItemDto) => item.id === addedItemId,
      );
      expect(itemInList).toBeDefined();

      // Remove item from list
      await apiHelpers.deleteShoppingItem(addedItemId);

      // Verify item is removed from list
      const listDetailAfterDeleteResponse =
        await apiHelpers.getShoppingListDetail(listId);

      const itemStillInList = listDetailAfterDeleteResponse.data.items.find(
        (item: ShoppingItemDto) => item.id === addedItemId,
      );
      expect(itemStillInList).toBeUndefined();

      // Verify custom item still exists in user items (not deleted)
      const customItemsResponse = await apiHelpers.getCustomItems();

      const customItemStillExists = customItemsResponse.data.find(
        (item: ShoppingItemDto) => item.name === temporaryItemName,
      );
      expect(customItemStillExists).toBeDefined();
    });

    // Step 10: User delete shopping list
    it('should delete shopping list', async () => {
      const listIdToDelete = createdEntityIds.shoppingListIds[0];
      await apiHelpers.deleteShoppingList(listIdToDelete);

      // Verify list is soft-deleted (doesn't appear in list)
      const getAllListsResponse = await apiHelpers.getShoppingLists();

      const deletedListStillExists = getAllListsResponse.data.find(
        (list: ShoppingListSummaryDto) => list.id === listIdToDelete,
      );
      expect(deletedListStillExists).toBeUndefined();
    });

    // Step 11: User create 2 shopping lists and get all shopping lists
    it('should create 2 shopping lists and get all lists', async () => {
      // Create first list
      const createFirstListResponse = await apiHelpers.createShoppingList(
        TEST_CONSTANTS.SHOPPING_LIST.NAME_3,
        TEST_CONSTANTS.SHOPPING_LIST.COLOR_3,
      );
      createdEntityIds.shoppingListIds.push(createFirstListResponse.data.id);

      // Create second list
      const createSecondListResponse = await apiHelpers.createShoppingList(
        TEST_CONSTANTS.SHOPPING_LIST.NAME_4,
        TEST_CONSTANTS.SHOPPING_LIST.COLOR_4,
      );
      createdEntityIds.shoppingListIds.push(createSecondListResponse.data.id);

      // Get all lists
      const getAllListsResponse = await apiHelpers.getShoppingLists();

      expect(getAllListsResponse.success).toBe(true);
      expect(getAllListsResponse.data.length).toBeGreaterThanOrEqual(2);

      const listNames = getAllListsResponse.data.map(
        (list: ShoppingListSummaryDto) => list.name,
      );
      expect(listNames).toContain(TEST_CONSTANTS.SHOPPING_LIST.NAME_3);
      expect(listNames).toContain(TEST_CONSTANTS.SHOPPING_LIST.NAME_4);
    });

    // Step 12: User create Recipe
    it('should create a recipe', async () => {
      const createRecipeResponse = await apiHelpers.createRecipe({
        title: TEST_CONSTANTS.RECIPE.TITLE_1,
        prepTime: TEST_CONSTANTS.RECIPE.PREP_TIME_1,
        ingredients: [
          TEST_CONSTANTS.RECIPE.INGREDIENT_FLOUR,
          TEST_CONSTANTS.RECIPE.INGREDIENT_SUGAR,
        ],
        instructions: [
          TEST_CONSTANTS.RECIPE.INSTRUCTION_1,
          TEST_CONSTANTS.RECIPE.INSTRUCTION_2,
        ],
      });

      expect(createRecipeResponse.success).toBe(true);
      expect(createRecipeResponse.data.id).toBeDefined();
      expect(createRecipeResponse.data.title).toBe(
        TEST_CONSTANTS.RECIPE.TITLE_1,
      );
      createdEntityIds.recipeIds.push(createRecipeResponse.data.id);
    });

    // Step 13: User edit Recipe
    it('should edit recipe', async () => {
      const recipeId = createdEntityIds.recipeIds[0];
      const updatedTitle = TEST_CONSTANTS.RECIPE.TITLE_2;

      const updateResponse = await apiHelpers.updateRecipe(recipeId, {
        title: updatedTitle,
        prepTime: TEST_CONSTANTS.RECIPE.PREP_TIME_2,
      });

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.title).toBe(updatedTitle);
      expect(updateResponse.data.prepTime).toBe(
        TEST_CONSTANTS.RECIPE.PREP_TIME_2,
      );
    });

    // Step 14: User remove Recipe
    it('should delete recipe', async () => {
      const recipeIdToDelete = createdEntityIds.recipeIds[0];
      await apiHelpers.deleteRecipe(recipeIdToDelete);

      // Verify recipe is soft-deleted (doesn't appear in list)
      const getAllRecipesResponse = await apiHelpers.getRecipes();

      const deletedRecipeStillExists = getAllRecipesResponse.data.find(
        (recipe: RecipeListItemDto) => recipe.id === recipeIdToDelete,
      );
      expect(deletedRecipeStillExists).toBeUndefined();
    });

    // Step 15: User creates 2 recipes and gets all recipes
    it('should create 2 recipes and get all recipes', async () => {
      // Create first recipe
      const createFirstRecipeResponse = await apiHelpers.createRecipe({
        title: TEST_CONSTANTS.RECIPE.TITLE_3,
        prepTime: TEST_CONSTANTS.RECIPE.PREP_TIME_3,
        ingredients: [{ name: 'Ingredient 1', quantity: 1 }],
        instructions: [{ step: 1, instruction: 'Step 1' }],
      });
      createdEntityIds.recipeIds.push(createFirstRecipeResponse.data.id);

      // Create second recipe
      const createSecondRecipeResponse = await apiHelpers.createRecipe({
        title: TEST_CONSTANTS.RECIPE.TITLE_4,
        prepTime: TEST_CONSTANTS.RECIPE.PREP_TIME_4,
        ingredients: [{ name: 'Ingredient 2', quantity: 2 }],
        instructions: [{ step: 1, instruction: 'Step 1' }],
      });
      createdEntityIds.recipeIds.push(createSecondRecipeResponse.data.id);

      // Get all recipes
      const getAllRecipesResponse = await apiHelpers.getRecipes();

      expect(getAllRecipesResponse.success).toBe(true);
      expect(getAllRecipesResponse.data.length).toBeGreaterThanOrEqual(2);

      const recipeTitles = getAllRecipesResponse.data.map(
        (recipe: RecipeListItemDto) => recipe.title,
      );
      expect(recipeTitles).toContain(TEST_CONSTANTS.RECIPE.TITLE_3);
      expect(recipeTitles).toContain(TEST_CONSTANTS.RECIPE.TITLE_4);
    });

    // Step 16: User create chore
    it('should create a chore', async () => {
      const dueDate = createDateWithOffset(TEST_CONSTANTS.CHORE.DAYS_OFFSET_1);

      const createChoreResponse = await apiHelpers.createChore({
        title: TEST_CONSTANTS.CHORE.TITLE_1,
        dueDate: dueDate.toISOString(),
      });

      expect(createChoreResponse.success).toBe(true);
      expect(createChoreResponse.data.id).toBeDefined();
      createdEntityIds.choreIds.push(createChoreResponse.data.id);
    });

    // Step 17: User edit chore
    it('should edit chore', async () => {
      const choreId = createdEntityIds.choreIds[0];
      const updatedTitle = TEST_CONSTANTS.CHORE.TITLE_2;
      const newDueDate = createDateWithOffset(
        TEST_CONSTANTS.CHORE.DAYS_OFFSET_2,
      );

      const updateResponse = await apiHelpers.updateChore(choreId, {
        title: updatedTitle,
        dueDate: newDueDate.toISOString(),
      });

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.title).toBe(updatedTitle);
    });

    // Step 18: User delete chore
    it('should delete chore', async () => {
      const choreIdToDelete = createdEntityIds.choreIds[0];
      await apiHelpers.deleteChore(choreIdToDelete);

      // Verify chore is soft-deleted (doesn't appear in list)
      const getAllChoresResponse = await apiHelpers.getChores();

      const allChores = [
        ...getAllChoresResponse.data.today,
        ...getAllChoresResponse.data.upcoming,
      ];
      const choreStillExists = allChores.find(
        (chore: ChoreDto) => chore.id === choreIdToDelete,
      );
      expect(choreStillExists).toBeUndefined();
    });

    // Step 19: User create 2 chores and get all chores
    it('should create 2 chores and get all chores', async () => {
      // Create first chore
      const dueDate1 = createDateWithOffset(TEST_CONSTANTS.CHORE.DAYS_OFFSET_1);

      const createFirstChoreResponse = await apiHelpers.createChore({
        title: TEST_CONSTANTS.CHORE.TITLE_3,
        dueDate: dueDate1.toISOString(),
      });
      createdEntityIds.choreIds.push(createFirstChoreResponse.data.id);

      // Create second chore
      const dueDate2 = createDateWithOffset(TEST_CONSTANTS.CHORE.DAYS_OFFSET_2);

      const createSecondChoreResponse = await apiHelpers.createChore({
        title: TEST_CONSTANTS.CHORE.TITLE_4,
        dueDate: dueDate2.toISOString(),
      });
      createdEntityIds.choreIds.push(createSecondChoreResponse.data.id);

      // Get all chores
      const getAllChoresResponse = await apiHelpers.getChores();

      expect(getAllChoresResponse.success).toBe(true);
      const allChores = [
        ...getAllChoresResponse.data.today,
        ...getAllChoresResponse.data.upcoming,
      ];
      expect(allChores.length).toBeGreaterThanOrEqual(2);

      const choreTitles = allChores.map((chore: ChoreDto) => chore.title);
      expect(choreTitles).toContain(TEST_CONSTANTS.CHORE.TITLE_3);
      expect(choreTitles).toContain(TEST_CONSTANTS.CHORE.TITLE_4);
    });
  });

  describe('Error Cases and Validation', () => {
    beforeEach(() => {
      // Ensure we have authenticated user for error case tests
      if (!testContext) {
        throw new Error(
          'Test context not initialized. Run Complete User Flow tests first.',
        );
      }
      apiHelpers.setAccessToken(testContext.accessToken);
    });

    type RegistrationTestPayload = {
      email?: string;
      password?: string;
      name?: string;
    };

    describe.each<[string, RegistrationTestPayload, number]>([
      ['missing email', { password: testPassword, name: testName }, 400],
      [
        'invalid email format',
        { email: 'invalid-email', password: testPassword, name: testName },
        400,
      ],
      ['missing password', { email: generateTestEmail(), name: testName }, 400],
      [
        'weak password',
        { email: generateTestEmail(), password: '123', name: testName },
        400,
      ],
    ])(
      'should reject registration with %s',
      (description, payload, expectedStatus) => {
        it(`should reject registration with ${description}`, async () => {
          const response = await apiHelpers.registerUser(
            payload.email || '',
            payload.password || '',
            payload.name || '',
            expectedStatus,
          );

          expect(response.success).toBe(false);
        });
      },
    );

    it('should reject unauthenticated requests', async () => {
      const unauthenticatedHelpers = new ApiTestHelpers(app);

      // Try to access protected endpoint without token
      const response =
        await unauthenticatedHelpers.unauthenticatedRequestWithoutExpect(
          'get',
          '/shopping-lists',
        );

      expect(response.status).toBe(401);
    });

    it('should reject invalid shopping list data', async () => {
      // Try to create list without required name
      const response = await apiHelpers.authenticatedRequestWithoutExpect(
        'post',
        '/shopping-lists',
        { name: '', color: TEST_CONSTANTS.SHOPPING_LIST.COLOR_1 },
      );

      expect(response.status).toBe(400);
    });
  });
});
