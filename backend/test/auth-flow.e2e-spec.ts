import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';

describe('Auth Flow E2E Test', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let householdId: string;
  let shoppingListId1: string;
  let shoppingListId2: string;
  let recipeId1: string;
  let choreId1: string;

  const API_URL = '/api/v1';
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'Test User';

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
  });

  afterAll(async () => {
    // Cleanup: delete test user and related data
    if (userId) {
      try {
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await app.close();
  });

  describe('Complete User Flow', () => {
    // Step 1: Create user
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_URL}/auth/register`)
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
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
      const response = await request(app.getHttpServer())
        .get(`${API_URL}/auth/verify-email`)
        .query({ token: user!.emailVerificationToken! })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      // Store token for subsequent requests
      accessToken = response.body.data.accessToken;
      userId = response.body.data.user.id;
      householdId =
        response.body.data.householdId || response.body.data.user.householdId;
    });

    // Step 3: Login (after email verification)
    it('should login user after email verification', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_URL}/auth/login`)
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();

      // Update token (in case verify-email didn't set it)
      if (!accessToken) {
        accessToken = response.body.data.accessToken;
        userId = response.body.data.user.id;
        householdId =
          response.body.data.householdId || response.body.data.user.householdId;
      }

      expect(householdId).toBeDefined();
    });

    // Step 4: Edit Household and confirm edit succeeded
    it('should edit household and confirm edit succeeded', async () => {
      const updatedName = 'Updated Test Household';

      const response = await request(app.getHttpServer())
        .put(`${API_URL}/household`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: updatedName,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedName);

      // Verify by getting household
      const getResponse = await request(app.getHttpServer())
        .get(`${API_URL}/household`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe(updatedName);
    });

    // Step 5: Create custom item (by adding item to shopping list)
    it('should create a shopping list first', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Shopping List',
          color: '#FF0000',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      shoppingListId1 = response.body.data.id;
    });

    it('should create custom item by adding to shopping list', async () => {
      const customItemName = 'My Custom Item';

      const response = await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists/${shoppingListId1}/items`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [
            {
              name: customItemName,
              quantity: 2,
              unit: 'pieces',
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.addedItems).toBeDefined();
      expect(response.body.data.addedItems.length).toBe(1);
      // Item added successfully
    });

    // Step 6: Get custom item
    it('should get custom items', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_URL}/shopping-items/custom`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      const customItem = response.body.data.find(
        (item: any) => item.name === 'My Custom Item',
      );
      expect(customItem).toBeDefined();
      // Custom item found
    });

    // Step 7: User create a shopping list (already done, but creating another)
    it('should create another shopping list', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Second Shopping List',
          color: '#00FF00',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      shoppingListId2 = response.body.data.id;
    });

    // Step 8: User add custom item to shopping list
    it('should add custom item to shopping list', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists/${shoppingListId2}/items`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [
            {
              name: 'My Custom Item', // Should reuse existing custom item
              quantity: 1,
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.addedItems.length).toBe(1);
    });

    // Step 9: User add custom item to shopping and then remove it - validate removal
    it('should add custom item to shopping list and then remove it', async () => {
      // Add item
      const addResponse = await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists/${shoppingListId2}/items`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [
            {
              name: 'Temporary Custom Item',
              quantity: 3,
            },
          ],
        })
        .expect(201);

      const addedItemId = addResponse.body.data.addedItems[0].id;

      // Verify item is in the list
      const listResponse = await request(app.getHttpServer())
        .get(`${API_URL}/shopping-lists/${shoppingListId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const itemInList = listResponse.body.data.items.find(
        (item: any) => item.id === addedItemId,
      );
      expect(itemInList).toBeDefined();

      // Remove item from list
      await request(app.getHttpServer())
        .delete(`${API_URL}/shopping-items/${addedItemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify item is removed from list
      const listResponseAfterDelete = await request(app.getHttpServer())
        .get(`${API_URL}/shopping-lists/${shoppingListId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const itemStillInList = listResponseAfterDelete.body.data.items.find(
        (item: any) => item.id === addedItemId,
      );
      expect(itemStillInList).toBeUndefined();

      // Verify custom item still exists in user items (not deleted)
      const customItemsResponse = await request(app.getHttpServer())
        .get(`${API_URL}/shopping-items/custom`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const customItemStillExists = customItemsResponse.body.data.find(
        (item: any) => item.name === 'Temporary Custom Item',
      );
      expect(customItemStillExists).toBeDefined();
    });

    // Step 10: User delete shopping list
    it('should delete shopping list', async () => {
      await request(app.getHttpServer())
        .delete(`${API_URL}/shopping-lists/${shoppingListId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify list is soft-deleted (doesn't appear in list)
      const getAllListsResponse = await request(app.getHttpServer())
        .get(`${API_URL}/shopping-lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const deletedListStillExists = getAllListsResponse.body.data.find(
        (list: any) => list.id === shoppingListId1,
      );
      expect(deletedListStillExists).toBeUndefined();
    });

    // Step 11: User create 2 shopping lists and get all shopping lists
    it('should create 2 shopping lists and get all lists', async () => {
      // Create first list
      const response1 = await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'List One',
          color: '#0000FF',
        })
        .expect(201);

      shoppingListId1 = response1.body.data.id;

      // Create second list
      await request(app.getHttpServer())
        .post(`${API_URL}/shopping-lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'List Two',
          color: '#FFFF00',
        })
        .expect(201);

      // Get all lists
      const getAllResponse = await request(app.getHttpServer())
        .get(`${API_URL}/shopping-lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data.length).toBeGreaterThanOrEqual(2);

      const listNames = getAllResponse.body.data.map((list: any) => list.name);
      expect(listNames).toContain('List One');
      expect(listNames).toContain('List Two');
    });

    // Step 12: User create Recipe
    it('should create a recipe', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_URL}/recipes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Recipe',
          prepTime: 30,
          ingredients: [
            { name: 'Flour', quantity: 2, unit: 'cups' },
            { name: 'Sugar', quantity: 1, unit: 'cup' },
          ],
          instructions: [
            { step: 1, instruction: 'Mix dry ingredients' },
            { step: 2, instruction: 'Add wet ingredients' },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('Test Recipe');
      recipeId1 = response.body.data.id;
    });

    // Step 13: User edit Recipe
    it('should edit recipe', async () => {
      const updatedTitle = 'Updated Test Recipe';

      const response = await request(app.getHttpServer())
        .put(`${API_URL}/recipes/${recipeId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: updatedTitle,
          prepTime: 45,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updatedTitle);
      expect(response.body.data.prepTime).toBe(45);
    });

    // Step 14: User remove Recipe
    it('should delete recipe', async () => {
      await request(app.getHttpServer())
        .delete(`${API_URL}/recipes/${recipeId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify recipe is soft-deleted (doesn't appear in list)
      const getAllRecipesResponse = await request(app.getHttpServer())
        .get(`${API_URL}/recipes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const deletedRecipeStillExists = getAllRecipesResponse.body.data.find(
        (recipe: any) => recipe.id === recipeId1,
      );
      expect(deletedRecipeStillExists).toBeUndefined();
    });

    // Step 15: User creates 2 recipes and gets all recipes
    it('should create 2 recipes and get all recipes', async () => {
      // Create first recipe
      const response1 = await request(app.getHttpServer())
        .post(`${API_URL}/recipes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Recipe One',
          prepTime: 20,
          ingredients: [{ name: 'Ingredient 1', quantity: 1 }],
          instructions: [{ step: 1, instruction: 'Step 1' }],
        })
        .expect(201);

      recipeId1 = response1.body.data.id;

      // Create second recipe
      await request(app.getHttpServer())
        .post(`${API_URL}/recipes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Recipe Two',
          prepTime: 25,
          ingredients: [{ name: 'Ingredient 2', quantity: 2 }],
          instructions: [{ step: 1, instruction: 'Step 1' }],
        })
        .expect(201);

      // Get all recipes
      const getAllResponse = await request(app.getHttpServer())
        .get(`${API_URL}/recipes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data.length).toBeGreaterThanOrEqual(2);

      const recipeTitles = getAllResponse.body.data.map(
        (recipe: any) => recipe.title,
      );
      expect(recipeTitles).toContain('Recipe One');
      expect(recipeTitles).toContain('Recipe Two');
    });

    // Step 16: User create chore
    it('should create a chore', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const response = await request(app.getHttpServer())
        .post(`${API_URL}/chores`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Chore',
          dueDate: dueDate.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      choreId1 = response.body.data.id;
    });

    // Step 17: User edit chore
    it('should edit chore', async () => {
      const updatedTitle = 'Updated Test Chore';
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 2);

      const response = await request(app.getHttpServer())
        .patch(`${API_URL}/chores/${choreId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: updatedTitle,
          dueDate: newDueDate.toISOString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updatedTitle);
    });

    // Step 18: User delete chore
    it('should delete chore', async () => {
      await request(app.getHttpServer())
        .delete(`${API_URL}/chores/${choreId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify chore is soft-deleted (doesn't appear in list)
      const getAllResponse = await request(app.getHttpServer())
        .get(`${API_URL}/chores`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const allChores = [
        ...getAllResponse.body.data.today,
        ...getAllResponse.body.data.upcoming,
      ];
      const choreStillExists = allChores.find(
        (chore: any) => chore.id === choreId1,
      );
      expect(choreStillExists).toBeUndefined();
    });

    // Step 19: User create 2 chores and get all chores
    it('should create 2 chores and get all chores', async () => {
      // Create first chore
      const dueDate1 = new Date();
      dueDate1.setDate(dueDate1.getDate() + 1);

      const response1 = await request(app.getHttpServer())
        .post(`${API_URL}/chores`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Chore One',
          dueDate: dueDate1.toISOString(),
        })
        .expect(201);

      choreId1 = response1.body.data.id;

      // Create second chore
      const dueDate2 = new Date();
      dueDate2.setDate(dueDate2.getDate() + 2);

      await request(app.getHttpServer())
        .post(`${API_URL}/chores`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Chore Two',
          dueDate: dueDate2.toISOString(),
        })
        .expect(201);

      // Get all chores
      const getAllResponse = await request(app.getHttpServer())
        .get(`${API_URL}/chores`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      const allChores = [
        ...getAllResponse.body.data.today,
        ...getAllResponse.body.data.upcoming,
      ];
      expect(allChores.length).toBeGreaterThanOrEqual(2);

      const choreTitles = allChores.map((chore: any) => chore.title);
      expect(choreTitles).toContain('Chore One');
      expect(choreTitles).toContain('Chore Two');
    });
  });
});
