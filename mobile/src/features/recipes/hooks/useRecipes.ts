import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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

    // Track if we've already triggered the initial fetch for the current user mode
    const lastFetchedModeRef = useRef<string | null>(null);

    // For signed-in users, trigger initial fetch ONLY on first login (when cache is missing)
    // This ensures getCached() is called, which will fetch from API ONLY if cache is missing
    // Subsequent navigations will use cache (no API calls)
    useEffect(() => {
        // Only fetch if we haven't fetched for this user mode yet AND cache is likely missing
        const modeKey = `${userMode}-${isSignedIn}`;
        if (isSignedIn && repository && !isAuthLoading && lastFetchedModeRef.current !== modeKey) {
            // Check if cache exists - only fetch if cache is missing
            repository.findAll()
                .then((recipes) => {
                    lastFetchedModeRef.current = modeKey;
                    console.log('[useRecipes] Initial cache check completed, recipes:', recipes.length);
                })
                .catch((error) => {
                    console.error('[useRecipes] Failed to check cache:', error);
                    // Reset flag on error so we can retry
                    lastFetchedModeRef.current = null;
                });
        }
    }, [isSignedIn, repository, isAuthLoading, userMode]);

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

    const getRecipeById = useCallback(async (recipeId: string): Promise<Recipe | null> => {
        if (!repository) {
            // Guest mode: find in guest recipes
            const found = guestRecipes.find(r => r.id === recipeId || r.localId === recipeId);
            return found || null;
        }
        
        // Signed-in mode: use repository (will fetch full details if missing)
        return repository.findById(recipeId);
    }, [repository, guestRecipes]);

    const refresh = useCallback(async (): Promise<void> => {
        if (!repository) {
            // Guest mode: reload from service
            try {
                setIsGuestLoading(true);
                setGuestError(null);
                const data = await service.getRecipes();
                setGuestRecipes(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error : new Error('Failed to refresh recipes');
                setGuestError(errorMessage);
                console.error('Failed to refresh recipes:', error);
            } finally {
                setIsGuestLoading(false);
            }
        } else {
            // Signed-in mode: force refresh from API
            try {
                await repository.refresh();
                // Cache events will trigger UI update via useCachedEntities
            } catch (error) {
                console.error('Failed to refresh recipes:', error);
                throw error;
            }
        }
    }, [repository, service]);

    return {
        recipes,
        isLoading,
        error,
        addRecipe,
        updateRecipe,
        getRecipeById,
        refresh,
    };
}
