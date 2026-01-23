import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { createRecipeService, IRecipeService } from '../services/recipeService';
import { Recipe } from '../../../mocks/recipes';
import { config } from '../../../config';

export function useRecipes() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const isMockDataEnabled = config.mockData.enabled;
    const shouldUseMockData = isMockDataEnabled || !user || user.isGuest;
    const service: IRecipeService = useMemo(() => {
        return createRecipeService(shouldUseMockData);
    }, [shouldUseMockData]);

    useEffect(() => {
        if (isAuthLoading) return;

        let isMounted = true;

        const fetchRecipes = async () => {
            setIsLoading(true);
            try {
                const data = await service.getRecipes();
                if (isMounted) {
                    setRecipes(data);
                    setError(null);
                }
            } catch (err) {
                console.error('Failed to fetch recipes:', err);
                if (isMounted) {
                    setError(err as Error);
                    // Optional: If remote fails, fallback or keep empty?
                    // for now just set empty
                    setRecipes([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchRecipes();

        return () => {
            isMounted = false;
        };
    }, [service, isAuthLoading]);

    const addRecipe = async (recipeData: Partial<Recipe>) => {
        try {
            const newRecipe = await service.createRecipe(recipeData);
            setRecipes(prev => [newRecipe, ...prev]);
            return newRecipe;
        } catch (err) {
            console.error('Failed to create recipe:', err);
            throw err;
        }
    };

    const updateRecipe = async (recipeId: string, updates: Partial<Recipe>) => {
        try {
            const updatedRecipe = await service.updateRecipe(recipeId, updates);
            setRecipes(prev =>
                prev.map(recipe => {
                    if (recipe.id !== recipeId) {
                        return recipe;
                    }

                    return {
                        ...recipe,
                        ...updates,
                        ...updatedRecipe,
                    };
                })
            );
            return updatedRecipe;
        } catch (err) {
            console.error('Failed to update recipe:', err);
            throw err;
        }
    };

    return {
        recipes,
        isLoading,
        error,
        addRecipe,
        updateRecipe,
    };
}
