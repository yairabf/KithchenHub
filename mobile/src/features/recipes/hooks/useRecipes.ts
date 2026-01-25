import { useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { createRecipeService, IRecipeService } from '../services/recipeService';
import { Recipe } from '../../../mocks/recipes';
import { config } from '../../../config';
import { determineUserDataMode } from '../../../common/types/dataModes';
import { useCachedEntities } from '../../../common/hooks/useCachedEntities';
import { CacheAwareRecipeRepository } from '../../../common/repositories/cacheAwareRecipeRepository';

export function useRecipes() {
    const { user, isLoading: isAuthLoading } = useAuth();

    // Determine data mode based on user authentication state
    const userMode = useMemo(() => {
        if (config.mockData.enabled) {
            return 'guest' as const;
        }
        return determineUserDataMode(user);
    }, [user]);

    // Create service based on mode
    const service: IRecipeService = useMemo(() => {
        return createRecipeService(userMode);
    }, [userMode]);

    // For signed-in users, use cache-aware repository with reactive cache hook
    // For guest users, use service directly (no cache)
    const isSignedIn = userMode === 'signed-in';
    
    const { data: cachedRecipes, isLoading: isCacheLoading, error: cacheError } = useCachedEntities<Recipe>('recipes');
    
    const repository = useMemo(() => {
        return isSignedIn ? new CacheAwareRecipeRepository(service) : null;
    }, [service, isSignedIn]);

    // For guest mode, fall back to service-based approach
    // For signed-in mode, use repository + cache hook
    const recipes = isSignedIn ? cachedRecipes : [];
    const isLoading = isAuthLoading || (isSignedIn ? isCacheLoading : false);
    const error = isSignedIn ? cacheError : null;

    const addRecipe = async (recipeData: Partial<Recipe>) => {
        if (!repository) {
            // Guest mode: use service directly
            return service.createRecipe(recipeData);
        }
        
        // Signed-in mode: use repository (cache events will trigger UI update)
        return repository.create(recipeData);
    };

    const updateRecipe = async (recipeId: string, updates: Partial<Recipe>) => {
        if (!repository) {
            // Guest mode: use service directly
            return service.updateRecipe(recipeId, updates);
        }
        
        // Signed-in mode: use repository (cache events will trigger UI update)
        return repository.update(recipeId, updates);
    };

    return {
        recipes,
        isLoading,
        error,
        addRecipe,
        updateRecipe,
    };
}
