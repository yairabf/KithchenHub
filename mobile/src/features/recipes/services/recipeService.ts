import { Recipe, mockRecipes, type Ingredient, type Instruction } from '../../../mocks/recipes';
import { api } from '../../../services/api';
import { guestStorage } from '../../../common/utils/guestStorage';
import type { DataMode } from '../../../common/types/dataModes';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';
import { withUpdatedAt, markDeleted, withCreatedAtAndUpdatedAt, toSupabaseTimestamps, normalizeTimestampsFromApi } from '../../../common/utils/timestamps';
import { isDevMode } from '../../../common/utils/devMode';
import { getCached, setCached, readCachedEntitiesForUpdate } from '../../../common/repositories/cacheAwareRepository';
import { EntityTimestamps } from '../../../common/types/entityMetadata';
import { getIsOnline } from '../../../common/utils/networkStatus';
import { resizeAndValidateImage, buildImageFormData } from '../../../common/utils';

/**
 * DTO types for API responses
 */
/**
 * Backend RecipeDetailDto format (what POST /recipes returns)
 */
type RecipeDetailDto = {
    id: string;
    title: string;
    description?: string;
    category?: string;
    prepTime?: number;
    cookTime?: number;
    ingredients: Array<{
        name: string;
        quantityAmount?: number;
        quantityUnit?: string;
        quantityUnitType?: string;
        quantityModifier?: string;
        quantity?: number;
        unit?: string;
    }>;
    instructions: Array<{ step: number; instruction: string }>;
    imageUrl?: string;
    thumbUrl?: string;
    imageVersion?: number;
    imageUpdatedAt?: string;
};

/**
 * Backend RecipeListItemDto format (what GET /recipes returns)
 */
type RecipeListItemDto = {
    id: string;
    title: string;
    description?: string;
    category?: string;
    cookTime?: number;
    imageUrl?: string;
    thumbUrl?: string;
    imageVersion?: number;
    imageUpdatedAt?: string;
};

/**
 * Legacy RecipeApiResponse type (kept for backward compatibility)
 * Maps to frontend Recipe format
 */
type RecipeApiResponse = {
    id: string;
    localId?: string;
    title: string;
    cookTime?: number;
    category?: string;
    ingredients?: any[];
    instructions?: any[];
    prepTime?: number;
    imageUrl?: string;
    thumbUrl?: string;
    imageVersion?: number;
    imageUpdatedAt?: string;
    description?: string;
    calories?: number;
    servings?: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    deletedAt?: string | Date | null;
};

/**
 * Maps backend RecipeDetailDto to frontend Recipe format
 */
function mapDetailDtoToRecipe(dto: RecipeDetailDto): RecipeApiResponse {
    // Map ingredients: backend RecipeIngredientDto[] -> frontend Ingredient[]
    const ingredients = (dto.ingredients ?? []).map((ing) => ({
        name: ing.name,
        quantityAmount: ing.quantityAmount ?? ing.quantity,
        quantityUnit: ing.quantityUnit ?? ing.unit,
        quantityUnitType: ing.quantityUnitType,
        quantityModifier: ing.quantityModifier,
        quantity: ing.quantity,
        unit: ing.unit,
    }));

    // Map instructions: backend RecipeInstructionDto[] -> frontend Instruction[]
    const instructions = (dto.instructions ?? []).map((inst) => ({
        step: inst.step,
        instruction: inst.instruction,
    }));

    return {
        id: dto.id,
        title: dto.title || 'Untitled Recipe',
        description: dto.description,
        prepTime: dto.prepTime,
        cookTime: dto.cookTime,
        category: dto.category,
        ingredients: ingredients,
        instructions: instructions,
        imageUrl: dto.imageUrl,
        thumbUrl: dto.thumbUrl,
        imageVersion: dto.imageVersion,
        imageUpdatedAt: dto.imageUpdatedAt,
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: undefined,
    };
}

export interface IRecipeService {
    getRecipes(): Promise<Recipe[]>;
    getRecipeById(recipeId: string): Promise<Recipe>;
    createRecipe(recipe: Partial<Recipe>): Promise<Recipe>;
    updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe>;
    deleteRecipe(recipeId: string): Promise<void>;
}

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10; // Brief delay to allow concurrent writes to complete

/**
 * Builds a new recipe object with validated required fields and defaults
 * 
 * @param recipe - Partial recipe data to build from
 * @returns A complete Recipe object with all required fields
 */
function buildRecipeWithDefaults(recipe: Partial<Recipe>): Recipe {
    const defaultTitle = 'New Recipe';
    const defaultLocalId = `local-uuid-${Date.now()}`;

    // Extract and validate title (handle empty/whitespace strings)
    const recipeTitle = (recipe.title && recipe.title.trim()) ? recipe.title : defaultTitle;
    const recipeLocalId = recipe.localId || defaultLocalId;

    return {
        id: `local-${Date.now()}`,
        localId: recipeLocalId,
        title: recipeTitle,
        cookTime: recipe.cookTime,
        category: recipe.category,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prepTime: recipe.prepTime,
        imageUrl: recipe.imageUrl,
        description: recipe.description,
        calories: recipe.calories,
        servings: recipe.servings,
    } as Recipe;
}

export class LocalRecipeService implements IRecipeService {
    /**
     * Seeds mock recipes into storage when empty (dev-only).
     * 
     * This method checks if the app is in development mode and if storage is truly empty
     * (no records at all, including soft-deleted). If both conditions are met, it seeds
     * mock recipes with proper timestamps and saves them to storage.
     * 
     * Note: guestStorage.getRecipes() returns ALL recipes including soft-deleted ones.
     * So recipes.length === 0 means storage is truly empty (no records at all).
     * 
     * @param existingRecipes - Current recipes from storage
     * @returns Seeded recipes if seeding occurred, null otherwise
     * @throws {Error} If seeding fails with a descriptive error message
     * @private
     */
    private async seedRecipesIfEmpty(existingRecipes: Recipe[]): Promise<Recipe[] | null> {
        // Only seed in dev mode when storage is truly empty
        const shouldSeed = isDevMode() && existingRecipes.length === 0;
        if (!shouldSeed) {
            return null;
        }

        try {
            // Ensure all mock recipes have createdAt and updatedAt timestamps
            // withCreatedAtAndUpdatedAt() is safe - it won't overwrite existing timestamps
            const seededRecipes = mockRecipes.map(recipe =>
                withCreatedAtAndUpdatedAt(recipe)
            );

            // Save seeded recipes to storage
            await guestStorage.saveRecipes(seededRecipes);

            return seededRecipes;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to seed mock recipes in dev mode: ${errorMessage}`);
        }
    }

    /**
     * Retrieves all recipes from guest storage.
     * 
     * In development mode, automatically seeds mock recipes if storage is empty.
     * This seeding only occurs when storage is truly empty (no records, including soft-deleted).
     * 
     * @returns Promise resolving to array of recipes
     * @throws {Error} If storage read fails or seeding fails in dev mode
     */
    async getRecipeById(recipeId: string): Promise<Recipe> {
        const guestRecipes = await guestStorage.getRecipes();
        const recipe = guestRecipes.find(r => r.id === recipeId || r.localId === recipeId);
        if (!recipe) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }
        return recipe;
    }

    async getRecipes(): Promise<Recipe[]> {
        const guestRecipes = await guestStorage.getRecipes();
        const seededRecipes = await this.seedRecipesIfEmpty(guestRecipes);
        return seededRecipes ?? guestRecipes;
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        const newRecipe = buildRecipeWithDefaults(recipe);

        // Validate recipe has required fields before saving
        if (!newRecipe.localId || !newRecipe.title || !newRecipe.title.trim()) {
            throw new Error('Invalid recipe data: missing required fields (localId, title)');
        }

        // Business rule: auto-populate createdAt and updatedAt on creation
        const withTimestamps = withCreatedAtAndUpdatedAt(newRecipe);

        // Persist to guest storage with retry logic for concurrent writes
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                await guestStorage.saveRecipes([...existingRecipes, withTimestamps]);
                return withTimestamps;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    throw new Error(`Failed to create recipe after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`);
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }

        // This should never be reached, but TypeScript needs it
        throw new Error('Failed to create recipe: unexpected error');
    }

    async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
        // Validate updates don't remove required fields
        if (updates.localId === null || updates.title === null) {
            throw new Error('Invalid recipe update: cannot remove required fields (localId, title)');
        }

        // Update with retry logic for concurrent writes
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                const recipeIndex = existingRecipes.findIndex(r => r.id === recipeId || r.localId === recipeId);

                if (recipeIndex === -1) {
                    throw new Error(`Recipe not found: ${recipeId}`);
                }

                const updatedRecipe = {
                    ...existingRecipes[recipeIndex],
                    ...updates,
                } as Recipe;

                // Validate updated recipe still has required fields
                if (!updatedRecipe.localId || !updatedRecipe.title) {
                    throw new Error('Invalid recipe update: missing required fields after update');
                }

                // Business rule: always update updatedAt on modification
                const withTimestamps = withUpdatedAt(updatedRecipe);

                const updatedRecipes = [...existingRecipes];
                updatedRecipes[recipeIndex] = withTimestamps;
                await guestStorage.saveRecipes(updatedRecipes);

                return withTimestamps;
            } catch (error) {
                // Don't retry if it's a validation error or not found error
                if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                    throw error;
                }

                retries--;
                if (retries === 0) {
                    throw new Error(`Failed to update recipe after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`);
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }

        // This should never be reached, but TypeScript needs it
        throw new Error('Failed to update recipe: unexpected error');
    }

    async deleteRecipe(recipeId: string): Promise<void> {
        // Business rule: soft-delete (tombstone pattern)
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                const recipeIndex = existingRecipes.findIndex(r => r.id === recipeId || r.localId === recipeId);

                if (recipeIndex === -1) {
                    throw new Error(`Recipe not found: ${recipeId}`);
                }

                // Business rule: mark as deleted, preserve tombstone
                const deletedRecipe = markDeleted(existingRecipes[recipeIndex]);
                // Also update updatedAt on delete
                const withTimestamps = withUpdatedAt(deletedRecipe);

                const updatedRecipes = [...existingRecipes];
                updatedRecipes[recipeIndex] = withTimestamps;
                await guestStorage.saveRecipes(updatedRecipes);
                return;
            } catch (error) {
                // Don't retry if it's a validation error or not found error
                if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                    throw error;
                }

                retries--;
                if (retries === 0) {
                    throw new Error(`Failed to delete recipe after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`);
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }

        // This should never be reached, but TypeScript needs it
        throw new Error('Failed to delete recipe: unexpected error');
    }
}

/**
 * Remote recipe service for signed-in users.
 * 
 * This service should only be instantiated for signed-in users.
 * Service factory (createRecipeService) prevents guest mode from creating this service.
 * 
 * Defense-in-depth: All methods make API calls which require authentication.
 * Guest users cannot provide valid JWT tokens, so API calls will fail at the backend.
 */
export class RemoteRecipeService implements IRecipeService {
    private isLocalImageUri(imageUrl?: string | null): boolean {
        if (!imageUrl) return false;
        return (
            imageUrl.startsWith('file://') ||
            imageUrl.startsWith('blob:') ||
            imageUrl.startsWith('data:')
        );
    }
    /**
     * Fetches recipes from API (used by cache layer)
     * 
     * @returns Array of recipes with normalized timestamps
     */
    private async fetchRecipesFromApi(): Promise<Recipe[]> {
        // Backend returns RecipeListItemDto[] for GET /recipes (only id, title, imageUrl)
        const response = await api.get<RecipeListItemDto[]>('/recipes');
        console.log('[RemoteRecipeService] fetchRecipesFromApi - received', response.length, 'recipes');
        console.log('[RemoteRecipeService] fetchRecipesFromApi - response:', JSON.stringify(response, null, 2));

        // Map list items to Recipe format (ingredients/instructions will be empty arrays)
        // Full details would require fetching each recipe individually via GET /recipes/:id
        const mapped = response.map((item) => {
            const recipe = {
                id: item.id,
                title: item.title || 'Untitled Recipe',
                description: item.description,
                imageUrl: item.imageUrl,
                thumbUrl: item.thumbUrl,
                imageVersion: item.imageVersion,
                imageUpdatedAt: item.imageUpdatedAt,
                ingredients: [],
                instructions: [],
                cookTime: item.cookTime,
                category: item.category,
            };
            console.log('[RemoteRecipeService] Mapped recipe item:', JSON.stringify({ id: recipe.id, title: recipe.title }, null, 2));
            return recipe;
        });

        console.log('[RemoteRecipeService] fetchRecipesFromApi - mapped recipes:', JSON.stringify(mapped, null, 2));

        // Normalize timestamps from API response (server is authority)
        // Ensure ingredients and instructions are always arrays
        return mapped.map((item) => {
            const normalized = normalizeTimestampsFromApi<Recipe>(item as any);
            console.log('[RemoteRecipeService] After normalization:', JSON.stringify({ id: normalized.id, title: normalized.title }, null, 2));

            // Preserve title field explicitly (it might be lost during normalization)
            const recipeTitle = item.title || normalized.title || 'Untitled Recipe';
            const finalRecipe = {
                ...normalized,
                title: recipeTitle, // Explicitly set title to ensure it's preserved
                description: normalized.description ?? item.description,
                ingredients: normalized.ingredients || [],
                instructions: normalized.instructions || [],
                cookTime: normalized.cookTime ?? item.cookTime,
                category: normalized.category ?? item.category,
            };
            console.log('[RemoteRecipeService] Final recipe:', JSON.stringify({ id: finalRecipe.id, title: finalRecipe.title }, null, 2));
            return finalRecipe;
        });
    }

    async getRecipeById(recipeId: string): Promise<Recipe> {
        console.log('[RemoteRecipeService] getRecipeById() called with recipeId:', recipeId);

        // First check cache using proper cache-aware read (handles versioned format)
        const cached = await readCachedEntitiesForUpdate<Recipe>('recipes');
        const cachedRecipe = cached.find(r => r.id === recipeId);

        // If cached recipe has full details (ingredients/instructions), return it
        if (cachedRecipe && cachedRecipe.ingredients && cachedRecipe.ingredients.length > 0) {
            console.log('[RemoteRecipeService] Found recipe in cache with full details');
            return cachedRecipe;
        }

        // Otherwise fetch from API
        console.log('[RemoteRecipeService] Fetching full recipe details from API...');
        const response = await api.get<RecipeDetailDto>(`/recipes/${recipeId}`);
        console.log('[RemoteRecipeService] API response:', JSON.stringify(response, null, 2));

        // Map backend RecipeDetailDto to frontend Recipe format
        const mappedResponse = mapDetailDtoToRecipe(response);
        console.log('[RemoteRecipeService] Mapped response:', JSON.stringify(mappedResponse, null, 2));

        // Normalize timestamps
        const normalized = normalizeTimestampsFromApi<Recipe>(mappedResponse);
        const recipeTitle = mappedResponse.title || normalized.title || 'Untitled Recipe';
        const fullRecipe = {
            ...normalized,
            title: recipeTitle,
            ingredients: normalized.ingredients || [],
            instructions: normalized.instructions || [],
            cookTime: normalized.cookTime ?? mappedResponse.cookTime,
            category: normalized.category ?? mappedResponse.category,
        };

        // Update cache with full details
        if (cachedRecipe) {
            // Replace the cached recipe with full details
            const updatedCache = cached.map(r => r.id === recipeId ? fullRecipe : r);
            await setCached('recipes', updatedCache, (r) => r.id);
        } else {
            // Add to cache if not found
            await setCached('recipes', [...cached, fullRecipe], (r) => r.id);
        }

        console.log('[RemoteRecipeService] Recipe details fetched and cached');
        return fullRecipe;
    }

    async getRecipes(): Promise<Recipe[]> {
        // Use cache-first strategy with background refresh
        return getCached<Recipe>(
            'recipes',
            () => this.fetchRecipesFromApi(),
            (recipe) => recipe.id,
            getIsOnline()
        );
    }

    /**
     * Maps frontend Recipe to backend CreateRecipeDto format
     */
    private mapRecipeToCreateDto(recipe: Partial<Recipe>): {
        title: string;
        prepTime?: number;
        ingredients: Array<{
            name: string;
            quantityAmount?: number;
            quantityUnit?: string;
            quantityUnitType?: string;
            quantityModifier?: string;
        }>;
        instructions: Array<{ step: number; instruction: string }>;
        imageUrl?: string;
    } {
        // Map ingredients: frontend Ingredient[] -> backend IngredientInputDto[]
        const ingredients = (recipe.ingredients || []).map((ing) => {
            const normalizedQuantity =
                typeof ing.quantityAmount === 'number'
                    ? ing.quantityAmount
                    : parseFloat(String(ing.quantityAmount ?? ''));
            const quantityAmount = Number.isFinite(normalizedQuantity) ? normalizedQuantity : undefined;
            const quantityUnit = ing.quantityUnit && ing.quantityUnit.trim().length > 0 ? ing.quantityUnit : undefined;
            return {
                name: ing.name,
                quantityAmount,
                quantityUnit,
                quantityUnitType: ing.quantityUnitType,
                quantityModifier: ing.quantityModifier,
            };
        });

        // Map instructions: frontend Instruction[] -> backend InstructionInputDto[]
        const instructions = (recipe.instructions || []).map((inst, index) => ({
            step: inst.step ?? index + 1,
            instruction: inst.instruction,
        }));

        // prepTime is already a number (in minutes)
        const prepTime = recipe.prepTime;

        return {
            title: recipe.title || 'Untitled Recipe',
            description: recipe.description?.trim() || undefined,
            prepTime,
            ingredients,
            instructions,
            imageUrl: recipe.imageUrl,
        };
    }

    /**
     * Maps frontend Recipe updates to backend UpdateRecipeDto format
     */
    private mapRecipeToUpdateDto(recipe: Partial<Recipe>): {
        title?: string;
        description?: string;
        category?: string;
        prepTime?: number;
        cookTime?: number;
        ingredients?: Array<{
            name: string;
            quantityAmount?: number;
            quantityUnit?: string;
            quantityUnitType?: string;
            quantityModifier?: string;
        }>;
        instructions?: Array<{ step: number; instruction: string }>;
        imageUrl?: string | null;
    } {
        const dto: {
            title?: string;
            description?: string;
            category?: string;
            prepTime?: number;
            cookTime?: number;
            ingredients?: Array<{
                name: string;
                quantityAmount?: number;
                quantityUnit?: string;
                quantityUnitType?: string;
                quantityModifier?: string;
            }>;
            instructions?: Array<{ step: number; instruction: string }>;
            imageUrl?: string | null;
        } = {};

        if (recipe.title !== undefined) {
            dto.title = recipe.title || 'Untitled Recipe';
        }
        if (recipe.description !== undefined) {
            dto.description = recipe.description?.trim() || undefined;
        }
        if (recipe.category !== undefined) {
            dto.category = recipe.category;
        }
        if (recipe.prepTime !== undefined) {
            dto.prepTime = recipe.prepTime;
        }
        if (recipe.cookTime !== undefined) {
            dto.cookTime = recipe.cookTime;
        }
        if (recipe.ingredients !== undefined) {
            dto.ingredients = (recipe.ingredients || []).map((ing: Ingredient) => {
                const normalizedQuantity =
                    typeof ing.quantityAmount === 'number'
                        ? ing.quantityAmount
                        : parseFloat(String(ing.quantityAmount ?? ''));
                const quantityAmount = Number.isFinite(normalizedQuantity) ? normalizedQuantity : undefined;
                const quantityUnit = ing.quantityUnit && ing.quantityUnit.trim().length > 0 ? ing.quantityUnit : undefined;
                return {
                    name: ing.name,
                    quantityAmount,
                    quantityUnit,
                    quantityUnitType: ing.quantityUnitType,
                    quantityModifier: ing.quantityModifier,
                };
            });
        }
        if (recipe.instructions !== undefined) {
            dto.instructions = (recipe.instructions || []).map((inst: Instruction, index: number) => ({
                step: inst.step ?? index + 1,
                instruction: inst.instruction,
            }));
        }
        if (recipe.imageUrl !== undefined) {
            dto.imageUrl = recipe.imageUrl;
        }

        return dto;
    }

    private async uploadRecipeImage(
        recipeId: string,
        imageUri: string
    ): Promise<RecipeDetailDto> {
        console.log('[RemoteRecipeService] Uploading image for recipe:', recipeId);

        const resized = await resizeAndValidateImage(imageUri);
        const formData = await buildImageFormData(resized.uri);

        const response = await api.upload<RecipeDetailDto>(
            `/recipes/${recipeId}/image`,
            formData
        );
        console.log('[RemoteRecipeService] Image upload successful');

        return response;
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        console.log('[RemoteRecipeService] createRecipe() called with recipe:', JSON.stringify(recipe, null, 2));

        // Map frontend Recipe format to backend CreateRecipeDto format
        const dto = this.mapRecipeToCreateDto(recipe);

        // If image is local, don't send it in initial create (wait for upload)
        const localImage = this.isLocalImageUri(recipe.imageUrl) ? recipe.imageUrl : undefined;
        if (localImage) {
            dto.imageUrl = undefined;
        }

        console.log('[RemoteRecipeService] Mapped to CreateRecipeDto:', JSON.stringify(dto, null, 2));

        console.log('[RemoteRecipeService] Making POST request to /recipes...');
        const response = await api.post<RecipeDetailDto>('/recipes', dto);
        console.log('[RemoteRecipeService] API response received:', JSON.stringify(response, null, 2));

        let finalRecipeDto = response;

        // If we had a local image, upload it now
        if (localImage) {
            try {
                const uploaded = await this.uploadRecipeImage(response.id, localImage);
                finalRecipeDto = { ...response, ...uploaded };
            } catch (error) {
                console.error('[RemoteRecipeService] Failed to upload image:', error);
                // Continue without image update, user can retry
            }
        }

        // Map backend RecipeDetailDto to frontend Recipe format
        const mappedResponse = mapDetailDtoToRecipe(finalRecipeDto);
        console.log('[RemoteRecipeService] Mapped response to Recipe format:', JSON.stringify(mappedResponse, null, 2));

        // Server is authority: overwrite with server timestamps
        const normalized = normalizeTimestampsFromApi<Recipe>(mappedResponse);
        // Ensure ingredients and instructions are always arrays
        // Preserve title field explicitly (it might be lost during normalization)
        const recipeTitle = mappedResponse.title || normalized.title || 'Untitled Recipe';
        const created = {
            ...normalized,
            title: recipeTitle, // Explicitly set title to ensure it's preserved
            ingredients: normalized.ingredients || [],
            instructions: normalized.instructions || [],
            cookTime: normalized.cookTime ?? mappedResponse.cookTime,
            category: normalized.category ?? mappedResponse.category,
        };
        console.log('[RemoteRecipeService] Normalized recipe:', JSON.stringify(created, null, 2));

        // Note: Cache update is handled by CacheAwareRecipeRepository
        // This service should not update cache directly to avoid duplicates
        // The repository will replace the optimistic entity with the server response
        console.log('[RemoteRecipeService] Cache update will be handled by repository');

        return created;
    }

    async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
        // Get existing recipe first (or merge with updates)
        const existing = await this.getRecipes().then(recipes =>
            recipes.find(r => r.id === recipeId)
        );
        if (!existing) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }

        const dto = this.mapRecipeToUpdateDto(updates);

        // Check for local image to upload
        const localImage = this.isLocalImageUri(updates.imageUrl) ? updates.imageUrl : undefined;
        if (localImage) {
            // Don't send local path as URL
            dto.imageUrl = undefined;
        }

        const response = await api.put<RecipeApiResponse>(`/recipes/${recipeId}`, dto);
        let updatedRecipe = normalizeTimestampsFromApi<Recipe>(response);

        if (localImage) {
            try {
                const uploaded = await this.uploadRecipeImage(recipeId, localImage);
                updatedRecipe = {
                    ...updatedRecipe,
                    imageUrl: uploaded.imageUrl ?? updatedRecipe.imageUrl,
                    thumbUrl: uploaded.thumbUrl ?? updatedRecipe.thumbUrl,
                    imageVersion: uploaded.imageVersion ?? updatedRecipe.imageVersion,
                    imageUpdatedAt: uploaded.imageUpdatedAt ?? updatedRecipe.imageUpdatedAt,
                };
            } catch (error) {
                console.error('[RemoteRecipeService] Failed to upload image:', error);
            }
        }

        // Write-through cache update: read cache directly (no network fetch)
        // Note: Cache updates are best-effort; failures are logged but don't throw
        const current = await readCachedEntitiesForUpdate<Recipe>('recipes');
        const updatedCache = current.map(r => r.id === recipeId ? updatedRecipe : r);
        await setCached('recipes', updatedCache, (r) => r.id);

        return updatedRecipe;
    }

    async deleteRecipe(recipeId: string): Promise<void> {
        // Get existing recipe
        const existing = await this.getRecipes().then(recipes =>
            recipes.find(r => r.id === recipeId)
        );
        if (!existing) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }

        // Apply timestamp for optimistic UI and offline queue
        const deleted = markDeleted(existing);
        const withTimestamps = withUpdatedAt(deleted);
        const payload = toSupabaseTimestamps(withTimestamps);

        // Use PATCH instead of DELETE with body (more compatible)
        await api.patch(`/recipes/${recipeId}`, { deleted_at: payload.deleted_at });

        // Write-through cache update: read cache directly (no network fetch)
        // Note: Cache updates are best-effort; failures are logged but don't throw
        const current = await readCachedEntitiesForUpdate<Recipe>('recipes');
        const updatedCache = current.map(r => r.id === recipeId ? withTimestamps : r);
        await setCached('recipes', updatedCache, (r) => r.id);
    }
}

/**
 * Creates a recipe service based on the data mode
 * 
 * @param mode - The data mode ('guest' | 'signed-in')
 * @param entityType - The type of entity being accessed (for validation)
 * @returns The appropriate recipe service implementation
 * @throws Error if the mode and service type are incompatible
 * 
 * @remarks
 * Note: Conflict resolution (sync application) should be called in the sync pipeline/repository layer,
 * NOT inside Remote*Service methods. This keeps services focused on transport.
 */
export const createRecipeService = (
    mode: 'guest' | 'signed-in',
    entityType: 'recipes' = 'recipes'
): IRecipeService => {
    // Validate service compatibility
    const serviceType = mode === 'guest' ? 'local' : 'remote';
    validateServiceCompatibility(serviceType, mode);

    return mode === 'guest' ? new LocalRecipeService() : new RemoteRecipeService();
};

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use createRecipeService with mode parameter instead
 */
export const createRecipeServiceLegacy = (isMockEnabled: boolean): IRecipeService => {
    const mode = isMockEnabled ? 'guest' : 'signed-in';
    return createRecipeService(mode);
};
