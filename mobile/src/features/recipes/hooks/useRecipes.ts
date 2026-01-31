import { useMemo, useState, useEffect } from 'react';
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

    // For guest mode, use service directly (no cache)
    const [guestRecipes, setGuestRecipes] = useState<Recipe[]>([]);
    const [isGuestLoading, setIsGuestLoading] = useState(true);
    const [guestError, setGuestError] = useState<Error | null>(null);

    // Load recipes for guest mode
    useEffect(() => {
        if (!isSignedIn) {
            let isMounted = true;
            const loadRecipes = async () => {
                try {
                    setIsGuestLoading(true);
                    setGuestError(null);
                    const data = await service.getRecipes();
                    if (isMounted) {
                        setGuestRecipes(data);
                    }
                } catch (error) {
                    if (isMounted) {
                        const errorMessage = error instanceof Error ? error : new Error('Failed to load recipes');
                        setGuestError(errorMessage);
                        console.error('Failed to load recipes:', error);
                    }
                } finally {
                    if (isMounted) {
                        setIsGuestLoading(false);
                    }
                }
            };
            loadRecipes();
            return () => { isMounted = false; };
        }
    }, [service, isSignedIn]);

    // For guest mode, use service-based approach
    // For signed-in mode, use repository + cache hook
    const recipes = isSignedIn ? cachedRecipes : guestRecipes;
    const isLoading = isAuthLoading || (isSignedIn ? isCacheLoading : isGuestLoading);
    const error = isSignedIn ? cacheError : guestError;

    const addRecipe = async (recipeData: Partial<Recipe>) => {
        if (!repository) {
            // Guest mode: create recipe and update local state. On failure, state is unchanged; error propagates to caller.
            const newRecipe = await service.createRecipe(recipeData);
            setGuestRecipes(prev => [...prev, newRecipe]);
            return newRecipe;
        }
        
        // Signed-in mode: use repository (cache events will trigger UI update)
        return repository.create(recipeData);
    };

    const updateRecipe = async (recipeId: string, updates: Partial<Recipe>) => {
        if (!repository) {
            // Guest mode: update recipe and update local state. On failure, state is unchanged; error propagates to caller.
            const updatedRecipe = await service.updateRecipe(recipeId, updates);
            setGuestRecipes(prev => 
                prev.map(recipe => recipe.id === recipeId ? updatedRecipe : recipe)
            );
            return updatedRecipe;
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
