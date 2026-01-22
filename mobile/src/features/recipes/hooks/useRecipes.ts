import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { IRecipeService, LocalRecipeService, RemoteRecipeService } from '../services/recipeService';
import { Recipe } from '../../../mocks/recipes';

export function useRecipes() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const service: IRecipeService = useMemo(() => {
        // Note: If user is null (not logged in), we might want to default to Local/Guest or Empty.
        // For now assuming Guest mode is default if no user or isGuest=true.
        if (!user || user.isGuest) {
            return new LocalRecipeService();
        }
        return new RemoteRecipeService();
    }, [user]);

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

    return {
        recipes,
        isLoading,
        error,
        addRecipe,
    };
}
