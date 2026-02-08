import { useEffect, useState } from 'react';
import { getCachedImageUri, type RecipeImageVariant } from '../services/recipeImageCache';

type UseRecipeImageParams = {
  recipeId: string;
  variant: RecipeImageVariant;
  imageVersion?: number | null;
  remoteUrl?: string | null;
};

export const useRecipeImage = ({
  recipeId,
  variant,
  imageVersion,
  remoteUrl,
}: UseRecipeImageParams) => {
  const [uri, setUri] = useState<string | null>(remoteUrl ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!remoteUrl) {
        setUri(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const cached = await getCachedImageUri({
        recipeId,
        variant,
        imageVersion,
        remoteUrl,
      });
      if (isMounted) {
        setUri(cached);
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [recipeId, variant, imageVersion, remoteUrl]);

  return { uri, isLoading };
};
